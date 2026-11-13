/**
 * No-database fallback for regular users.
 *
 * When DB_* is not configured (e.g. local testing), regular numbers/emails can
 * still log in: the OTP is kept as a signed, hashed, short-lived cookie instead
 * of the `otps` table, and the session uses a reserved GUEST id. Guests never
 * have a subscription, so they always land on the plans page and cannot open
 * Home. As soon as the database is configured, this fallback is not used.
 */
import { createHmac } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { safeEqual, signValue } from './userAuth';
import { OTP_TTL_SECS, RESEND_COOLDOWN_SECS, MAX_VERIFY_ATTEMPTS } from './otp';

export const GUEST_USER_ID = -2;
const OTP_COOKIE = 'mr_otp';
const GUEST_COOKIE = 'mr_guest';

export function isDbConfigured(): boolean {
  return !!process.env.DB_NAME && !!process.env.DB_USER;
}

export function isGuestUserId(userId: number | null | undefined): boolean {
  return userId === GUEST_USER_ID && !isDbConfigured();
}

const enc = (v: string) => Buffer.from(v).toString('base64url');
const dec = (v: string) => Buffer.from(v, 'base64url').toString();

function otpHash(identifier: string, otp: string) {
  return createHmac('sha256', signValue('guest-otp-key')).update(`${identifier}:${otp}`).digest('hex');
}

function cookieOpts(maxAge: number) {
  return { path: '/', maxAge, sameSite: 'lax' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
}

interface OtpState { id: string; exp: number; sent: number; hash: string; attempts: number }

function readOtp(req: NextRequest): OtpState | null {
  try {
    const raw = req.cookies.get(OTP_COOKIE)?.value;
    if (!raw) return null;
    const i = raw.lastIndexOf('.');
    const body = raw.slice(0, i);
    if (!safeEqual(signValue(`guest-otp:${body}`), raw.slice(i + 1))) return null;
    return JSON.parse(dec(body)) as OtpState;
  } catch {
    return null;
  }
}

function writeOtp(res: NextResponse, s: OtpState) {
  const body = enc(JSON.stringify(s));
  res.cookies.set(OTP_COOKIE, `${body}.${signValue(`guest-otp:${body}`)}`, cookieOpts(OTP_TTL_SECS));
}

/** Seconds to wait before another OTP may be sent (0 = allowed). */
export function guestResendWait(req: NextRequest, identifier: string): number {
  const s = readOtp(req);
  if (!s || s.id !== identifier) return 0;
  return Math.max(0, RESEND_COOLDOWN_SECS - Math.floor((Date.now() - s.sent) / 1000));
}

export function storeGuestOtp(res: NextResponse, identifier: string, otp: string) {
  writeOtp(res, { id: identifier, exp: Date.now() + OTP_TTL_SECS * 1000, sent: Date.now(), hash: otpHash(identifier, otp), attempts: 0 });
}

export function verifyGuestOtp(
  req: NextRequest,
  res: NextResponse,
  identifier: string,
  otp: string,
): { ok: true } | { ok: false; message: string; attemptsLeft?: number } {
  const s = readOtp(req);
  if (!s || s.id !== identifier || s.exp < Date.now() || s.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, message: 'This OTP has expired or is no longer valid. Please request a new one.' };
  }
  if (!safeEqual(s.hash, otpHash(identifier, otp))) {
    const attempts = s.attempts + 1;
    writeOtp(res, { ...s, attempts });
    const left = MAX_VERIFY_ATTEMPTS - attempts;
    return left <= 0
      ? { ok: false, message: 'Too many wrong attempts. Please request a new OTP.', attemptsLeft: 0 }
      : { ok: false, message: `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.`, attemptsLeft: left };
  }
  res.cookies.set(OTP_COOKIE, '', { path: '/', maxAge: 0 });
  return { ok: true };
}

export function setGuestIdentity(res: NextResponse, identifier: string, maxAge: number) {
  const body = enc(identifier);
  res.cookies.set(GUEST_COOKIE, `${body}.${signValue(`guest-id:${body}`)}`, cookieOpts(maxAge));
}

export function readGuestIdentity(req: NextRequest): { mobile: string | null; email: string | null } {
  try {
    const raw = req.cookies.get(GUEST_COOKIE)?.value ?? '';
    const i = raw.lastIndexOf('.');
    const body = raw.slice(0, i);
    if (!body || !safeEqual(signValue(`guest-id:${body}`), raw.slice(i + 1))) return { mobile: null, email: null };
    const id = dec(body);
    return id.includes('@') ? { mobile: null, email: id } : { mobile: id, email: null };
  } catch {
    return { mobile: null, email: null };
  }
}
