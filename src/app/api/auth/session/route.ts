import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import { clearSessionCookies, setSessionCookies, SUB_COOKIE, TOKEN_COOKIE } from '@/lib/session';
import { getActiveSubscriptionEnd, getUser } from '@/lib/users';
import { isValidSubFlag, verifyUserToken } from '@/lib/userAuth';
import { isGuestUserId, readGuestIdentity } from '@/lib/guest';

/**
 * Re-checks the session against the database and refreshes the cookies when
 * the subscription state changed (e.g. renewed elsewhere, or expired early).
 * Used by the subscription page so an already-subscribed user lands on Home.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(TOKEN_COOKIE)?.value;
    const userId = verifyUserToken(token);

    if (isGuestUserId(userId)) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        data: { ...readGuestIdentity(req), hasActiveSub: false },
      });
    }
    const user = userId ? await getUser(userId) : null;
    if (!user) {
      const res = NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      clearSessionCookies(res);
      return res;
    }

    const subEnd = await getActiveSubscriptionEnd(user.id);
    const hasActiveSub = !!subEnd;
    const res = NextResponse.json({
      success: true,
      authenticated: true,
      data: { mobile: user.mobile, email: user.email, hasActiveSub },
    });
    const cookieSaysSub = isValidSubFlag(token, req.cookies.get(SUB_COOKIE)?.value);
    if (cookieSaysSub !== hasActiveSub) setSessionCookies(res, user.id, subEnd);
    return res;
  } catch (err) {
    return serverErrorResponse('session', err);
  }
}
