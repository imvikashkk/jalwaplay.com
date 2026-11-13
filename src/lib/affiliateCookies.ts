import type { NextRequest, NextResponse } from 'next/server';

/**
 * Affiliate click capture (no DB imports — safe for the proxy).
 * See lib/affiliate.ts for the postback side.
 */

export const AFF_PUB_COOKIE = 'jp_pub';
export const AFF_CLICK_COOKIE = 'jp_click_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const CLICK_RE = /^[A-Za-z0-9._~:\-]{1,200}$/;
const PUB_RE = /^[A-Za-z0-9_\-]{1,50}$/;

/** Accept only real IDs — rejects unreplaced macros like `{}` or `{click_id}`. */
export function cleanClickId(v: string | null | undefined): string | null {
  const s = (v ?? '').trim();
  return CLICK_RE.test(s) ? s : null;
}
export function cleanPub(v: string | null | undefined): string | null {
  const s = (v ?? '').trim();
  return PUB_RE.test(s) ? s : null;
}

/** Called from the proxy on every page request that carries the params. */
export function captureAffiliateParams(req: NextRequest, res: NextResponse): void {
  const clickId = cleanClickId(req.nextUrl.searchParams.get('click_id'));
  if (!clickId) return;
  const pub = cleanPub(req.nextUrl.searchParams.get('pub'));
  const opts = { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  res.cookies.set(AFF_CLICK_COOKIE, clickId, opts);
  if (pub) res.cookies.set(AFF_PUB_COOKIE, pub, opts);
  else res.cookies.set(AFF_PUB_COOKIE, '', { path: '/', maxAge: 0 });
}

export function readAffiliateCookies(req: NextRequest): { pub: string | null; clickId: string | null } {
  return {
    clickId: cleanClickId(req.cookies.get(AFF_CLICK_COOKIE)?.value),
    pub: cleanPub(req.cookies.get(AFF_PUB_COOKIE)?.value),
  };
}
