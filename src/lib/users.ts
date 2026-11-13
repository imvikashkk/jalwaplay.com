import pool from './db';
import type { LoginChannel } from './validation';

export interface DbUser {
  id: number;
  mobile: string | null;
  email: string | null;
}

/** Creates the user on first login, otherwise touches updated_at. */
export async function upsertUser(channel: LoginChannel, identifier: string): Promise<DbUser> {
  const column = channel === 'email' ? 'email' : 'mobile';
  const res = await pool.query(
    `INSERT INTO users (${column}) VALUES ($1)
     ON CONFLICT (${column}) DO UPDATE SET updated_at = NOW()
     RETURNING id, mobile, email`,
    [identifier],
  );
  return res.rows[0];
}

export async function getUser(userId: number): Promise<DbUser | null> {
  const res = await pool.query(`SELECT id, mobile, email FROM users WHERE id = $1 AND is_active = true`, [userId]);
  return res.rows[0] ?? null;
}

/** End date of the user's current active subscription, or null. */
export async function getActiveSubscriptionEnd(userId: number): Promise<Date | null> {
  const res = await pool.query(
    `SELECT end_date FROM subscriptions
     WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
     ORDER BY end_date DESC LIMIT 1`,
    [userId],
  );
  return res.rows.length ? new Date(res.rows[0].end_date) : null;
}
