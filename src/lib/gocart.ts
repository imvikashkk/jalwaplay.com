/** GoCart (genzdeal) UPI PayIn gateway helpers. */
const BASE = 'https://app.genzdeal.com';

function keys() {
  return {
    AccessKey: process.env.GOCART_ACCESS_KEY ?? '',
    SecretKey: process.env.GOCART_SECRET_KEY ?? '',
  };
}

export async function createPayinIntent(params: {
  userId: number;
  amount: number;
  mobile: string | null;
  email: string | null;
  userAgent: string;
  txnId: string;
}): Promise<{ intentUrl: string | null; intentId: string | null; expiresAt: string | null; message?: string }> {
  const res = await fetch(`${BASE}/payin/intent/`, {
    method: 'POST',
    headers: { ...keys(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: `User${params.userId}`,
      amount: params.amount,
      mobile: params.mobile ?? '',
      email: params.email ?? `${params.mobile}@jalwaplay.com`,
      device_info: params.userAgent.slice(0, 255) || 'web',
      payin_ref: params.txnId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const intentUrl = data.details?.intent_url ?? null;
  if (data.error || !intentUrl) {
    return { intentUrl: null, intentId: null, expiresAt: null, message: data.message ?? 'Payment init failed' };
  }
  return {
    intentUrl,
    intentId: data.details?.txnid ?? null,
    expiresAt: data.data?.expiresAt ?? null,
  };
}

export async function checkPayinStatus(gpIntentId: string): Promise<{
  paid: boolean;
  gpTxnId: string | null;
  amount: number;
  raw: object;
} | null> {
  try {
    const res = await fetch(`${BASE}/payin/status/${encodeURIComponent(gpIntentId)}/`, {
      headers: keys(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const status = String(data.details?.status ?? '').toLowerCase();
    return {
      paid: status === 'success',
      gpTxnId: data.details?.rrn ?? data.details?.txn_ref_id ?? null,
      amount: parseFloat(data.details?.amount ?? '0'),
      raw: data,
    };
  } catch (err) {
    console.error('GoCart PayIn status check error:', err);
    return null;
  }
}
