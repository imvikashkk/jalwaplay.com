import { NextRequest, NextResponse } from 'next/server';
import { enquireTransaction, mapStatus, verifyReturnSignature } from '@/lib/sabpaisa';
import { applySabpaisaResult } from '@/lib/sabpaisaPayment';
import { publicUrl } from '@/lib/appUrl';

/**
 * SabPaisa returnUrl. The customer comes back here after paying, with
 * transaction_id, merchant_txn_id, status, amount, paid_amount, payment_mode,
 * timestamp and signature in the query string.
 *
 * Query params can be spoofed, so the payment is always confirmed with
 * SabPaisa's Enquiry API before a subscription is activated.
 */
async function handle(req: NextRequest, params: URLSearchParams) {
  const statusUrl = (status: string, txnId = '') => {
    const u = publicUrl(req, '/payment/status');
    u.searchParams.set('status', status);
    if (txnId) u.searchParams.set('txnid', txnId);
    return NextResponse.redirect(u, 303);
  };

  const txnId = params.get('merchant_txn_id') ?? params.get('merchantTxnId') ?? '';
  if (!txnId) return statusUrl('failed');

  try {
    const enquiry = await enquireTransaction(txnId);
    if (enquiry) {
      const applied = await applySabpaisaResult(enquiry, req);
      const status = applied.status === 'not_found' ? 'failed' : applied.status;
      return statusUrl(status, txnId);
    }

    // Enquiry unavailable — never activate here; let /payment/status retry.
    const signed = verifyReturnSignature(params);
    const reported = signed ? mapStatus(params.get('status') ?? '') : 'pending';
    return statusUrl(reported === 'failed' ? 'failed' : 'pending', txnId);
  } catch (err) {
    console.error('sabpaisa/callback error:', err);
    return statusUrl('pending', txnId);
  }
}

export async function GET(req: NextRequest) {
  return handle(req, req.nextUrl.searchParams);
}

// Some setups return with a form POST instead of a GET.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const params = new URLSearchParams(req.nextUrl.search);
  form?.forEach((v, k) => {
    if (typeof v === 'string') params.set(k, v);
  });
  return handle(req, params);
}
