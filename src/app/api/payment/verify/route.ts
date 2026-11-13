import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import pool from '@/lib/db';
import { activateSubscription } from '@/lib/activateSubscription';
import { enquireTransaction } from '@/lib/sabpaisa';
import { applySabpaisaResult } from '@/lib/sabpaisaPayment';
import { setSessionCookies } from '@/lib/session';
import { verifyUserToken } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const sessionUserId = verifyUserToken(req.cookies.get('mr_token')?.value);
    if (!sessionUserId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { txnId } = await req.json().catch(() => ({}));
    if (!txnId || typeof txnId !== 'string') {
      return NextResponse.json({ success: false, message: 'txnId required' }, { status: 400 });
    }

    const payRes = await pool.query(
      `SELECT p.id, p.user_id, p.status, p.amount, u.mobile
       FROM payments p JOIN users u ON u.id = p.user_id
       WHERE p.txn_id = $1`,
      [txnId],
    );

    // Only the paying user may confirm (and receive session cookies for) a payment.
    if (payRes.rows.length === 0 || payRes.rows[0].user_id !== sessionUserId) {
      return NextResponse.json({ success: false, message: 'Payment record not found' }, { status: 404 });
    }
    const pay = payRes.rows[0];

    const done = (userId: number, endDate: Date) => {
      const response = NextResponse.json({ success: true });
      setSessionCookies(response, userId, endDate);
      return response;
    };

    // Already processed (webhook or an earlier poll) — just refresh the session.
    if (pay.status === 'success') {
      const result = await activateSubscription(txnId, null, {}, 0, '', '', req);
      if (!result) return NextResponse.json({ success: false, message: 'Activation failed' });
      return done(result.userId, result.newEndDate);
    }

    if (pay.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Payment failed' });
    }

    // Callback not received yet — ask SabPaisa directly (Transaction Enquiry API).
    const enquiry = await enquireTransaction(txnId);
    if (!enquiry) {
      return NextResponse.json({ success: false, message: 'Payment not completed yet' });
    }
    const applied = await applySabpaisaResult(enquiry, req);
    if (applied.status === 'success') return done(applied.userId, applied.endDate);
    if (applied.status === 'failed') return NextResponse.json({ success: false, message: 'Payment failed' });
    return NextResponse.json({ success: false, message: 'Payment not completed yet' });
  } catch (err) {
    return serverErrorResponse('payment/verify', err);
  }
}
