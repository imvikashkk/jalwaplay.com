import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidSubFlag, verifyUserToken } from '@/lib/userAuth';
import { GUEST_USER_ID, isDbConfigured } from '@/lib/guest';
import { captureAffiliateParams } from '@/lib/affiliateCookies';

// Set AUTH_WALL_DISABLED=true to temporarily open the site without login
// (e.g. during payment-gateway review). Default: login + subscription required.
const AUTH_WALL_DISABLED = process.env.AUTH_WALL_DISABLED === 'true';

// Always reachable (payment gateway onboarding/verification needs these).
const LEGAL_PAGES = [
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-and-cancellation',
  '/contact',
];

// Reachable without a user session. `/admin` has its own login (see lib/adminAuth).
const PUBLIC = ['/api', '/payment', '/admin', ...LEGAL_PAGES];

// Reachable with a session but without an active subscription.
const NO_SUB_REQUIRED = ['/subscription', '/profile'];

const TRACKING_PARAMS = ['c', 'meta_campaign_id', 'meta_campaign_name', 'fbclid', 'pub', 'click_id'];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Redirect while preserving campaign + Meta click params. */
function redirectWithTracking(req: NextRequest, to: string) {
  const url = new URL(to, req.url);
  for (const key of TRACKING_PARAMS) {
    const v = req.nextUrl.searchParams.get(key);
    if (v) url.searchParams.set(key, v);
  }
  return NextResponse.redirect(url);
}

function clearSession(res: NextResponse) {
  res.cookies.set('mr_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('mr_has_sub', '', { path: '/', maxAge: 0 });
  return res;
}

export function proxy(req: NextRequest) {
  const res = route(req);
  // Affiliate click (?pub=..&click_id=..) → first-party cookie, whatever the response is.
  captureAffiliateParams(req, res);
  return res;
}

function route(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (AUTH_WALL_DISABLED) {
    if (pathname === '/' || matches(pathname, ['/api', '/admin', ...LEGAL_PAGES])) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  const rawToken = req.cookies.get('mr_token')?.value;
  const tokenUserId = verifyUserToken(rawToken);
  // Real users have positive ids; the guest id is only valid while no DB is configured.
  // (Old demo sessions used id -1 and are no longer accepted.)
  const loggedIn =
    tokenUserId !== null &&
    (tokenUserId > 0 || (tokenUserId === GUEST_USER_ID && !isDbConfigured()));
  const hasSub = loggedIn && isValidSubFlag(rawToken, req.cookies.get('mr_has_sub')?.value);
  const staleCookie = !!rawToken && !loggedIn;

  // Auth pages: logged-in users go straight to where they belong.
  if (matches(pathname, ['/auth'])) {
    if (loggedIn) return redirectWithTracking(req, hasSub ? '/' : '/subscription');
    const res = NextResponse.next();
    // Never serve the login form from cache (e.g. Back after logging in).
    res.headers.set('Cache-Control', 'no-store, must-revalidate');
    return staleCookie ? clearSession(res) : res;
  }

  if (matches(pathname, PUBLIC)) return NextResponse.next();

  // Not logged in (or expired/tampered session) → login
  if (!loggedIn) {
    const res = redirectWithTracking(req, '/auth');
    return staleCookie ? clearSession(res) : res;
  }

  // Logged in but no active subscription → plans
  if (!hasSub && !matches(pathname, NO_SUB_REQUIRED)) {
    return redirectWithTracking(req, '/subscription');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|upi).*)'],
};
