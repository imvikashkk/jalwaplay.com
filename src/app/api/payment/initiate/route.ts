import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import pool from '@/lib/db';
import { verifyUserToken } from '@/lib/userAuth';
import { getUser } from '@/lib/users';
import { createPayment, isSabpaisaConfigured } from '@/lib/sabpaisa';
import { isGuestUserId } from '@/lib/guest';
import { readAffiliateCookies } from '@/lib/affiliateCookies';

export async function POST(req: NextRequest) {
  try {
    const userId = verifyUserToken(req.cookies.get('mr_token')?.value);
    if (!userId)
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const planId = Number(body.planId);
    // _fbp/_fbc from request cookies are most reliable — fallback to body values
    let fbp: string = req.cookies.get('_fbp')?.value || body.fbp || '';
    let fbc: string = req.cookies.get('_fbc')?.value || body.fbc || '';
    let campaignSlug: string = body.campaignSlug ?? '';
    let metaCampaignId: string | null = body.metaCampaignId ?? null;
    let metaCampaignName: string | null = body.metaCampaignName ?? null;

    if (!Number.isInteger(planId) || planId <= 0) {
      return NextResponse.json({ success: false, message: 'Please select a plan.' }, { status: 400 });
    }

    if (isGuestUserId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Payments are not available right now. Please try again later.' },
        { status: 503 },
      );
    }

    const [planRes, user] = await Promise.all([
      pool.query(`SELECT id, name, price FROM plans WHERE id = $1 AND is_active = true`, [planId]),
      getUser(userId),
    ]);

    if (planRes.rows.length === 0)
      return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
    if (!user)
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const plan = planRes.rows[0];
    const identifier = user.mobile ?? user.email;

    // Fallback to stored first-touch attribution if current session has no campaign
    if (!campaignSlug && identifier) {
      const attrRes = await pool.query(
        `SELECT campaign_slug, meta_campaign_id, meta_campaign_name, fbp, fbc FROM phone_attributions WHERE mobile = $1`,
        [identifier],
      );
      if (attrRes.rows.length > 0) {
        const attr = attrRes.rows[0];
        campaignSlug = attr.campaign_slug || campaignSlug;
        metaCampaignId = attr.meta_campaign_id || metaCampaignId;
        metaCampaignName = attr.meta_campaign_name || metaCampaignName;
        if (!fbp && attr.fbp) fbp = attr.fbp;
        if (!fbc && attr.fbc) fbc = attr.fbc;
      }
    }

    // Affiliate click: cookie first, else the one saved at login for this mobile.
    let { pub, clickId } = readAffiliateCookies(req);
    if (!clickId && identifier) {
      const affRes = await pool
        .query(`SELECT pub, click_id FROM phone_attributions WHERE mobile = $1`, [identifier])
        .catch(() => null);
      if (affRes?.rows[0]?.click_id) {
        clickId = affRes.rows[0].click_id;
        pub = affRes.rows[0].pub;
      }
    }

    if (!isSabpaisaConfigured()) {
      console.error('payment/initiate: SabPaisa is not configured (SABPAISA_* env vars missing)');
      return NextResponse.json(
        { success: false, message: 'Payments are not available right now. Please try again later.' },
        { status: 503 },
      );
    }

    const txnId = `MR${Date.now()}${userId}`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/+$/, '');
    const mobile = user.mobile ?? '';

    await pool.query(
      `INSERT INTO payments (user_id, plan_id, txn_id, amount, status, campaign_slug, fbp, fbc, meta_campaign_id, meta_campaign_name, pub, click_id)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10,$11)`,
      [userId, planId, txnId, plan.price, campaignSlug || null, fbp, fbc, metaCampaignId, metaCampaignName, pub, clickId],
    );

    const payment = await createPayment({
      txnId,
      amountRupees: plan.price,
      customerName: 'Jalwaplay User',
      customerEmail: user.email ?? `${mobile || userId}@jalwaplay.com`,
      customerPhone: mobile,
      returnUrl: `${appUrl}/api/payment/sabpaisa/callback`,
      description: `${plan.name} subscription`,
      udf1: String(planId),
    });

    if (!payment.ok) {
      await pool.query(
        `UPDATE payments SET status='failed', gateway_response=$1, updated_at=NOW() WHERE txn_id=$2`,
        [JSON.stringify({ initError: payment.message }), txnId],
      );
      return NextResponse.json({ success: false, message: payment.message }, { status: 502 });
    }

    if (payment.paymentId) {
      await pool.query(`UPDATE payments SET gp_intent_id=$1 WHERE txn_id=$2`, [payment.paymentId, txnId]);
    }

    // The browser is sent to SabPaisa's hosted checkout page.
    return NextResponse.json({
      success: true,
      data: { gateway: 'sabpaisa', txnId, amount: plan.price, redirectUrl: payment.redirectUrl },
    });
  } catch (err) {
    return serverErrorResponse('payment/initiate', err);
  }
}
