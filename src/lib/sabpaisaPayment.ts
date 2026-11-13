import type { NextRequest } from 'next/server';
import pool from './db';
import { activateSubscription } from './activateSubscription';
import type { SabpaisaResult } from './sabpaisa';

export type ApplyOutcome =
  | { status: 'success'; userId: number; endDate: Date }
  | { status: 'failed' | 'pending' | 'not_found' };

/**
 * Applies a decrypted SabPaisa result (callback or enquiry) to our payment record.
 * Activates the subscription only when the paid amount covers the plan price.
 * Idempotent: safe to call several times for the same transaction.
 */
export async function applySabpaisaResult(result: SabpaisaResult, req: NextRequest): Promise<ApplyOutcome> {
  const payRes = await pool.query(`SELECT user_id, amount, status FROM payments WHERE txn_id = $1`, [
    result.clientTxnId,
  ]);
  const pay = payRes.rows[0];
  if (!pay) return { status: 'not_found' };

  if (pay.status === 'failed') return { status: 'failed' };

  if (pay.status === 'success' || result.outcome === 'success') {
    if (pay.status !== 'success' && result.amount + 0.001 < Number(pay.amount)) {
      console.error(`SabPaisa amount mismatch for ${result.clientTxnId}: paid ${result.amount}, expected ${pay.amount}`);
      await markFailed(result);
      return { status: 'failed' };
    }
    const act = await activateSubscription(
      result.clientTxnId,
      result.sabpaisaTxnId,
      result.raw,
      result.amount,
      '',
      '',
      req,
    );
    return act ? { status: 'success', userId: act.userId, endDate: act.newEndDate } : { status: 'pending' };
  }

  if (result.outcome === 'failed') {
    await markFailed(result);
    return { status: 'failed' };
  }
  return { status: 'pending' };
}

async function markFailed(result: SabpaisaResult) {
  await pool.query(
    `UPDATE payments SET status='failed', gateway_txn_id=$1, gateway_response=$2, updated_at=NOW()
     WHERE txn_id=$3 AND status='pending'`,
    [result.sabpaisaTxnId, JSON.stringify(result.raw), result.clientTxnId],
  );
}
