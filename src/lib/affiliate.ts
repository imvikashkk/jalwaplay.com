import pool from './db';

/**
 * Affiliate (S2S postback) tracking.
 *
 *   Landing:  https://jalwaplay.com/?pub=01&click_id=<network click id>
 *   → proxy stores pub + click_id in first-party cookies (30 days, last click wins)
 *   → payment/initiate copies them onto the payment row
 *   → on a successful payment the server fires AFFILIATE_POSTBACK_URL once per click_id.
 *
 * AFFILIATE_POSTBACK_URL placeholders: {click_id} {payout} {pub} {txn_id}
 */

function buildUrl(template: string, v: { clickId: string; payout: number; pub: string | null; txnId: string }) {
  return template
    .replaceAll('{click_id}', encodeURIComponent(v.clickId))
    .replaceAll('{payout}', encodeURIComponent(String(v.payout)))
    .replaceAll('{pub}', encodeURIComponent(v.pub ?? ''))
    .replaceAll('{txn_id}', encodeURIComponent(v.txnId));
}

/**
 * Fire the postback for a successful payment. Safe to call more than once:
 * the row is claimed atomically, and a click_id is only ever converted once.
 * Never throws — failures are recorded on the payment row.
 */
export async function sendAffiliatePostback(paymentId: number): Promise<void> {
  const template = process.env.AFFILIATE_POSTBACK_URL;
  if (!template) return;

  try {
    const claim = await pool.query(
      `UPDATE payments SET postback_status = 'sending'
       WHERE id = $1 AND status = 'success' AND click_id IS NOT NULL AND postback_status IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM payments p2
           WHERE p2.click_id = payments.click_id AND p2.id <> payments.id
             AND p2.postback_status IN ('sent', 'sending'))
       RETURNING click_id, pub, amount, txn_id`,
      [paymentId],
    );
    if (claim.rowCount === 0) return;
    const row = claim.rows[0];

    const url = buildUrl(template, { clickId: row.click_id, payout: Number(row.amount), pub: row.pub, txnId: row.txn_id });

    let status = 'failed';
    let detail = '';
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      detail = `HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`;
      if (res.ok) status = 'sent';
    } catch (err) {
      detail = `Request error: ${String(err).slice(0, 300)}`;
    }

    await pool.query(
      `UPDATE payments SET postback_status = $1, postback_response = $2, postback_sent_at = NOW() WHERE id = $3`,
      [status, detail, paymentId],
    );
    if (status !== 'sent') console.error(`affiliate postback failed (payment ${paymentId}):`, detail);
  } catch (err) {
    console.error('affiliate postback error:', err);
  }
}
