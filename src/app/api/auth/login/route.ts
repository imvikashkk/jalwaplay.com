import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import pool from '@/lib/db';
import { GUEST_USER_ID, isDbConfigured, setGuestIdentity } from '@/lib/guest';
import { setSessionCookies } from '@/lib/session';
import { getActiveSubscriptionEnd, upsertUser } from '@/lib/users';
import { isValidMobile, normalizeMobile } from '@/lib/validation';
import { readAffiliateCookies } from '@/lib/affiliateCookies';

const clean = (v: unknown) =>
  typeof v === 'string' && v && !v.includes('{{') ? v.slice(0, 200) : null;

/**
 * Direct mobile-number login (no OTP).
 * Creates the user on first visit and starts a session. The client then sends
 * users without an active subscription to the payment page (/subscription)
 * and subscribers to Home.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(String(body.mobile ?? ''));

    if (!isValidMobile(mobile)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 },
      );
    }

    // No database configured: temporary guest session (can't pay, no subscription).
    if (!isDbConfigured()) {
      const response = NextResponse.json({
        success: true,
        data: { mobile, email: null, hasActiveSub: false },
      });
      const { secs } = setSessionCookies(response, GUEST_USER_ID, null);
      setGuestIdentity(response, mobile, secs);
      return response;
    }

    // First-touch attribution (campaign + fbp/fbc) — used later for Meta CAPI.
    const campaignSlug = clean(body.campaignSlug);
    if (campaignSlug) {
      const fbp = req.cookies.get('_fbp')?.value || clean(body.fbp);
      const fbc = req.cookies.get('_fbc')?.value || clean(body.fbc);
      await pool
        .query(
          `INSERT INTO phone_attributions (mobile, campaign_slug, meta_campaign_id, meta_campaign_name, fbp, fbc)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mobile) DO UPDATE SET
             campaign_slug      = EXCLUDED.campaign_slug,
             meta_campaign_id   = EXCLUDED.meta_campaign_id,
             meta_campaign_name = EXCLUDED.meta_campaign_name,
             fbp                = EXCLUDED.fbp,
             fbc                = EXCLUDED.fbc`,
          [mobile, campaignSlug, clean(body.metaCampaignId), clean(body.metaCampaignName), fbp, fbc],
        )
        .catch((err) => console.error('phone_attributions save error:', err));
    }

    // Affiliate click (cookie set by the proxy) — kept per mobile as a fallback for checkout.
    const aff = readAffiliateCookies(req);
    if (aff.clickId) {
      await pool
        .query(
          `INSERT INTO phone_attributions (mobile, pub, click_id) VALUES ($1, $2, $3)
           ON CONFLICT (mobile) DO UPDATE SET pub = EXCLUDED.pub, click_id = EXCLUDED.click_id`,
          [mobile, aff.pub, aff.clickId],
        )
        .catch((err) => console.error('affiliate attribution save error:', err));
    }

    const user = await upsertUser('mobile', mobile);
    const subEnd = await getActiveSubscriptionEnd(user.id);

    const response = NextResponse.json({
      success: true,
      data: { mobile: user.mobile, email: user.email, hasActiveSub: !!subEnd },
    });
    setSessionCookies(response, user.id, subEnd);
    return response;
  } catch (err) {
    return serverErrorResponse('login', err);
  }
}
