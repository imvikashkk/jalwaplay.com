import { NextRequest, NextResponse } from 'next/server';
import { publicUrl } from '@/lib/appUrl';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body   = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));
    const txnId  = params.txnid ?? params.orderId ?? params.transactionId;

    if (txnId) {
      await pool.query(
        `UPDATE payments SET status='failed', gateway_response=$1, updated_at=NOW()
         WHERE txn_id=$2 AND status='pending'`,
        [JSON.stringify(params), txnId],
      );
    }
  } catch (err) {
    console.error('payment/failed error:', err);
  }

  return NextResponse.redirect(publicUrl(req, '/subscription'), 303);
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(publicUrl(req, '/subscription'), 303);
}
