import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { activateSubscription } from '@/lib/activateSubscription';
import { checkPayinStatus } from '@/lib/gocart';

// Legacy browser-redirect fallback — GoCart PayIn does not redirect the browser
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/subscription', req.url), 303);
}

// GoCart PayIn server-to-server webhook — called once the transaction completes.
// The webhook body is NOT trusted: the payment is re-confirmed with the gateway
// before any subscription is activated.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { txnid, status } = body;

    if (!txnid || String(status).toLowerCase() !== 'success') {
      return NextResponse.json({ received: true });
    }

    const payRes = await pool.query(
      `SELECT gp_intent_id FROM payments WHERE txn_id = $1 AND status = 'pending'`,
      [String(txnid)],
    );
    const gpIntentId = payRes.rows[0]?.gp_intent_id;
    if (!gpIntentId) return NextResponse.json({ received: true, processed: false });

    const gpCheck = await checkPayinStatus(gpIntentId);
    if (!gpCheck?.paid) return NextResponse.json({ received: true, processed: false });

    const result = await activateSubscription(
      String(txnid),
      gpCheck.gpTxnId,
      gpCheck.raw,
      gpCheck.amount,
      '',
      '',
      req,
    );

    return NextResponse.json({ received: true, processed: !!result });
  } catch (err) {
    console.error('payment/callback webhook error:', err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
