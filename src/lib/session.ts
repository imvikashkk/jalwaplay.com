import type { NextResponse } from 'next/server';
import { generateUserToken, signSubFlag } from './userAuth';

export const TOKEN_COOKIE = 'mr_token';
export const SUB_COOKIE = 'mr_has_sub';

/** Session length for logged-in users without an active subscription. */
export const NO_SUB_SESSION_SECS = 60 * 60 * 24 * 3; // 3 days

const LEGACY_COOKIES = ['mr_uid', 'mr_sub', 'mr_mob'];

function baseOpts(maxAge: number) {
  return {
    path: '/',
    maxAge,
    sameSite: 'lax' as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
}

/** Seconds until the given subscription end date (min 60s). */
export function secsUntil(endDate: Date): number {
  return Math.max(60, Math.ceil((endDate.getTime() - Date.now()) / 1000));
}

/**
 * Issues the session cookies. Subscribed sessions last until the subscription
 * ends; others last NO_SUB_SESSION_SECS.
 */
export function setSessionCookies(
  res: NextResponse,
  userId: number,
  subEndDate: Date | null,
) {
  const hasSub = !!subEndDate && subEndDate.getTime() > Date.now();
  const secs = hasSub ? secsUntil(subEndDate!) : NO_SUB_SESSION_SECS;
  const token = generateUserToken(userId, secs);
  res.cookies.set(TOKEN_COOKIE, token, baseOpts(secs));
  res.cookies.set(SUB_COOKIE, hasSub ? signSubFlag(token) : '0', baseOpts(secs));
  for (const c of LEGACY_COOKIES) res.cookies.set(c, '', { path: '/', maxAge: 0 });
  return { token, hasSub, secs };
}

export function clearSessionCookies(res: NextResponse) {
  for (const c of [TOKEN_COOKIE, SUB_COOKIE, ...LEGACY_COOKIES]) {
    res.cookies.set(c, '', { path: '/', maxAge: 0 });
  }
}
