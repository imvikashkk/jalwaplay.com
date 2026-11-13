import { createHmac, randomInt } from 'crypto';
import pool from './db';
import { safeEqual } from './userAuth';
import type { LoginChannel } from './validation';

export const OTP_TTL_SECS = 10 * 60; // matches the SMS template's "valid for 10 min"
export const RESEND_COOLDOWN_SECS = 30; // keep in sync with the OTP page timer
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_VERIFY_ATTEMPTS = 5;

function hashOtp(identifier: string, otp: string): string {
  const secret = process.env.USER_TOKEN_SECRET || 'user-dev-secret-change-in-prod';
  return createHmac('sha256', secret).update(`otp:${identifier}:${otp}`).digest('hex');
}

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export type SendCheck =
  | { ok: true }
  | { ok: false; message: string; retryAfter?: number };

/** Rate limits: one OTP per cooldown window and a max per rolling hour. */
export async function checkSendAllowed(identifier: string): Promise<SendCheck> {
  const res = await pool.query(
    `SELECT
       COUNT(*)::int AS sent_last_hour,
       COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))::int, 999999) AS secs_since_last
     FROM otps
     WHERE identifier = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [identifier],
  );
  const { sent_last_hour, secs_since_last } = res.rows[0];
  if (secs_since_last < RESEND_COOLDOWN_SECS) {
    const retryAfter = RESEND_COOLDOWN_SECS - secs_since_last;
    return { ok: false, message: `Please wait ${retryAfter}s before requesting a new OTP.`, retryAfter };
  }
  if (sent_last_hour >= MAX_SENDS_PER_HOUR) {
    return { ok: false, message: 'Too many OTP requests. Please try again after some time.' };
  }
  return { ok: true };
}

/** Stores a hashed OTP and returns its row id. */
export async function storeOtp(identifier: string, channel: LoginChannel, otp: string): Promise<number> {
  // A new code invalidates any older unused codes for this identifier.
  await pool.query(`UPDATE otps SET is_used = true WHERE identifier = $1 AND is_used = false`, [identifier]);
  const res = await pool.query(
    `INSERT INTO otps (identifier, channel, mobile, otp, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + make_interval(secs => $5))
     RETURNING id`,
    [identifier, channel, channel === 'mobile' ? identifier : null, hashOtp(identifier, otp), OTP_TTL_SECS],
  );
  return res.rows[0].id;
}

/** Undo a stored OTP whose delivery failed, so it doesn't count toward rate limits. */
export async function discardOtp(id: number) {
  await pool.query(`DELETE FROM otps WHERE id = $1`, [id]).catch(() => {});
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; message: string; attemptsLeft?: number };

export async function verifyStoredOtp(identifier: string, otp: string): Promise<VerifyResult> {
  const res = await pool.query(
    `SELECT id, otp, attempts FROM otps
     WHERE identifier = $1 AND is_used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [identifier],
  );
  if (res.rows.length === 0) {
    return { ok: false, message: 'This OTP has expired or is no longer valid. Please request a new one.' };
  }
  const row = res.rows[0];

  if (!safeEqual(row.otp, hashOtp(identifier, otp))) {
    const attempts = row.attempts + 1;
    const locked = attempts >= MAX_VERIFY_ATTEMPTS;
    await pool.query(`UPDATE otps SET attempts = $1, is_used = $2 WHERE id = $3`, [attempts, locked, row.id]);
    if (locked) {
      return { ok: false, message: 'Too many wrong attempts. Please request a new OTP.', attemptsLeft: 0 };
    }
    const left = MAX_VERIFY_ATTEMPTS - attempts;
    return { ok: false, message: `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.`, attemptsLeft: left };
  }

  // Mark used atomically so the same code can't be replayed concurrently.
  const upd = await pool.query(`UPDATE otps SET is_used = true WHERE id = $1 AND is_used = false`, [row.id]);
  if (upd.rowCount === 0) return { ok: false, message: 'OTP already used. Please request a new one.' };
  return { ok: true };
}
