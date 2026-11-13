/**
 * SabPaisa payment gateway — v2 Merchant API (PG 3.0).
 * Docs: https://devdocs.sabpaisa.in/api-reference
 *
 * Credentials (from SabPaisa): client code (= merchant id), API key, secret key.
 *
 * Flow:
 *   1. /api/payment/initiate → createPayment(): POST /api/v2/payments with an
 *      HMAC-SHA256 checksum; SabPaisa returns checkoutUrl + clientSecret.
 *   2. The browser is redirected to `${checkoutUrl}?clientSecret=…`.
 *   3. After payment SabPaisa redirects to /api/payment/sabpaisa/callback (returnUrl).
 *      Query params can be spoofed, so the result is always confirmed with
 *      enquireTransaction() (POST /api/v2/payments/enquiry) before activating.
 *
 * Server-only module.
 */
import { createHmac, timingSafeEqual } from 'crypto';

const BASE_URLS = {
  staging: 'https://staging-sb-merchant-api.sabpaisa.in',
  production: 'https://merchant-api.sabpaisa.in',
};

function cfg() {
  const env = process.env.SABPAISA_ENV === 'production' ? 'production' : 'staging';
  const clientCode = process.env.SABPAISA_CLIENT_CODE ?? '';
  return {
    clientCode,
    // SabPaisa's merchantId is usually the same value as the client code.
    merchantId: process.env.SABPAISA_MERCHANT_ID || clientCode,
    apiKey: process.env.SABPAISA_API_KEY ?? '',
    secretKey: process.env.SABPAISA_SECRET_KEY ?? '',
    baseUrl: (process.env.SABPAISA_BASE_URL || BASE_URLS[env]).replace(/\/+$/, ''),
  };
}

export function isSabpaisaConfigured(): boolean {
  const c = cfg();
  return !!(c.merchantId && c.apiKey && c.secretKey);
}

const hmacHex = (data: string, key: string) => createHmac('sha256', key).update(data).digest('hex');

function headers() {
  const c = cfg();
  return { 'Content-Type': 'application/json', 'X-Api-Key': c.apiKey, 'X-Merchant-Id': c.merchantId };
}

// ── Create payment ──────────────────────────────────────────────────────────

export async function createPayment(params: {
  txnId: string;
  amountRupees: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  description?: string;
  udf1?: string;
}): Promise<{ ok: true; redirectUrl: string; paymentId: string | null } | { ok: false; message: string }> {
  const c = cfg();
  const amount = Math.round(params.amountRupees * 100); // paise
  const currency = 'INR';
  const timestamp = Math.floor(Date.now() / 1000);
  const checksum = hmacHex(`${c.merchantId}|${params.txnId}|${amount}|${currency}|${timestamp}`, c.secretKey);

  try {
    const res = await fetch(`${c.baseUrl}/api/v2/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        merchantId: c.merchantId,
        merchantTxnId: params.txnId,
        amount,
        currency,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        returnUrl: params.returnUrl,
        description: params.description,
        udf1: params.udf1,
        checksum,
        timestamp,
      }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    const body = data.data && !data.checkoutUrl ? data.data : data;
    if (!res.ok || data.success === false || !body.checkoutUrl) {
      console.error('SabPaisa create payment failed:', res.status, JSON.stringify(data));
      return { ok: false, message: data.message || data.error?.message || 'Payment init failed' };
    }
    const url = new URL(body.checkoutUrl);
    if (body.clientSecret) url.searchParams.set('clientSecret', body.clientSecret);
    return { ok: true, redirectUrl: url.toString(), paymentId: body.paymentId ?? null };
  } catch (err) {
    console.error('SabPaisa create payment error:', err);
    return { ok: false, message: 'Could not reach the payment gateway. Please try again.' };
  }
}

// ── Result handling ─────────────────────────────────────────────────────────

export type SabpaisaOutcome = 'success' | 'failed' | 'pending';

export interface SabpaisaResult {
  outcome: SabpaisaOutcome;
  clientTxnId: string;
  sabpaisaTxnId: string | null;
  /** Amount actually paid, in rupees. */
  amount: number;
  message: string;
  raw: object;
}

export function mapStatus(status: string): SabpaisaOutcome {
  const s = status.toUpperCase();
  if (s === 'SUCCESS') return 'success';
  if (['FAILED', 'FAILURE', 'EXPIRED', 'TIMEOUT', 'CANCELLED', 'ABORTED', 'REJECTED'].includes(s)) return 'failed';
  return 'pending'; // PENDING, PROCESSING, INITIATED, …
}

/** Status Enquiry API — the source of truth. Returns null if SabPaisa can't be reached. */
export async function enquireTransaction(txnId: string): Promise<SabpaisaResult | null> {
  const c = cfg();
  try {
    const res = await fetch(`${c.baseUrl}/api/v2/payments/enquiry`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ clientCode: c.clientCode || c.merchantId, merchantTxnId: txnId }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('SabPaisa enquiry failed:', res.status, JSON.stringify(json));
      return null;
    }
    const d = json.data && typeof json.data === 'object' && !json.status ? json.data : json;
    if (!d.status) return null;

    // Never trust a response for a different transaction.
    const echoedTxn = d.merchantTxnId ?? d.clientTxnId;
    if (echoedTxn && echoedTxn !== txnId) return null;

    const paid =
      d.paidAmount != null
        ? Number(d.paidAmount)
        : d.amountPaise != null
          ? Number(d.amountPaise) / 100
          : Number(d.amount ?? 0);

    return {
      outcome: mapStatus(String(d.status)),
      clientTxnId: txnId,
      sabpaisaTxnId: d.txnId ?? d.spTxnId ?? d.bankRrn ?? null,
      amount: Number.isFinite(paid) ? paid : 0,
      message: String(d.message ?? d.status),
      raw: d,
    };
  } catch (err) {
    console.error('SabPaisa enquiry error:', err);
    return null;
  }
}

/**
 * Verifies the `signature` on the return URL: remaining params sorted by key,
 * joined as `key=value` with `|`, HMAC-SHA256 (secret key), lowercase hex.
 */
export function verifyReturnSignature(params: URLSearchParams): boolean {
  const sig = params.get('signature');
  if (!sig) return false;
  const message = [...params.keys()]
    .filter((k) => k !== 'signature')
    .sort()
    .map((k) => `${k}=${params.get(k) ?? ''}`)
    .join('|');
  const expected = Buffer.from(hmacHex(message, cfg().secretKey));
  const given = Buffer.from(sig.toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}
