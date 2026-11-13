import pool from './db';

/** Read-only queries for the admin panel. All dates are bucketed in IST. */

const TZ = 'Asia/Kolkata';
export const PAGE_SIZE = 25;

export type Range = 'today' | '7d' | '30d' | 'all';
export const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
];

export function parseRange(v: string | undefined, fallback: Range = 'all'): Range {
  return v === 'today' || v === '7d' || v === '30d' || v === 'all' ? v : fallback;
}

/** SQL condition on `col` for the selected range ('' for all time). */
function rangeSql(col: string, range: Range): string {
  switch (range) {
    case 'today':
      return `${col} >= (date_trunc('day', NOW() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}')`;
    case '7d':
      return `${col} >= NOW() - INTERVAL '7 days'`;
    case '30d':
      return `${col} >= NOW() - INTERVAL '30 days'`;
    default:
      return '';
  }
}

// Payment method as reported by the gateway (key name varies by API version).
const MODE_SQL = `NULLIF(COALESCE(
  p.gateway_response->>'paymentMode', p.gateway_response->>'payment_mode',
  p.gateway_response->>'paymode', p.gateway_response->>'paymentMethod'), '')`;

const n = (v: unknown) => Number(v ?? 0);

/* ── Overview ─────────────────────────────────────────────────────── */

export interface Overview {
  revenue: number;
  successCount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  totalCount: number;
  todayRevenue: number;
  monthRevenue: number;
  activeSubs: number;
  expiringSoon: number;
  totalUsers: number;
  newUsers: number;
  daily: { day: string; revenue: number; count: number }[];
  byPlan: { name: string; count: number; revenue: number }[];
  byMode: { mode: string; count: number; revenue: number }[];
}

export async function getOverview(range: Range): Promise<Overview> {
  const r = rangeSql('p.created_at', range);
  const where = r ? `WHERE ${r}` : '';
  const and = r ? `AND ${r}` : '';
  const ur = rangeSql('created_at', range);

  const [totals, special, subs, users, daily, byPlan, byMode] = await Promise.all([
    pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status='success'),0) AS revenue,
        COUNT(*) FILTER (WHERE status='success') AS success_count,
        COUNT(*) FILTER (WHERE status='pending') AS pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status='pending'),0) AS pending_amount,
        COUNT(*) FILTER (WHERE status='failed') AS failed_count,
        COUNT(*) AS total_count
      FROM payments p ${where}`),
    pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE created_at >= (date_trunc('day', NOW() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}')),0) AS today,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= (date_trunc('month', NOW() AT TIME ZONE '${TZ}') AT TIME ZONE '${TZ}')),0) AS month
      FROM payments WHERE status='success'`),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='active' AND end_date > NOW()) AS active,
        COUNT(*) FILTER (WHERE status='active' AND end_date > NOW() AND end_date <= NOW() + INTERVAL '3 days') AS expiring
      FROM subscriptions`),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE ${ur || 'true'}) AS new FROM users`),
    pool.query(`
      SELECT to_char(d, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(p.amount),0) AS revenue, COUNT(p.id) AS count
      FROM generate_series(
             (NOW() AT TIME ZONE '${TZ}')::date - 13, (NOW() AT TIME ZONE '${TZ}')::date, INTERVAL '1 day') d
      LEFT JOIN payments p
        ON p.status='success' AND (p.created_at AT TIME ZONE '${TZ}')::date = d::date
      GROUP BY d ORDER BY d`),
    pool.query(`
      SELECT pl.name, COUNT(p.id) AS count, COALESCE(SUM(p.amount),0) AS revenue
      FROM plans pl
      LEFT JOIN payments p ON p.plan_id = pl.id AND p.status='success' ${and}
      GROUP BY pl.id, pl.name, pl.price ORDER BY pl.price`),
    pool.query(`
      SELECT COALESCE(${MODE_SQL}, 'Unknown') AS mode, COUNT(*) AS count, COALESCE(SUM(amount),0) AS revenue
      FROM payments p WHERE status='success' ${and}
      GROUP BY 1 ORDER BY revenue DESC LIMIT 6`),
  ]);

  const t = totals.rows[0];
  return {
    revenue: n(t.revenue),
    successCount: n(t.success_count),
    pendingCount: n(t.pending_count),
    pendingAmount: n(t.pending_amount),
    failedCount: n(t.failed_count),
    totalCount: n(t.total_count),
    todayRevenue: n(special.rows[0].today),
    monthRevenue: n(special.rows[0].month),
    activeSubs: n(subs.rows[0].active),
    expiringSoon: n(subs.rows[0].expiring),
    totalUsers: n(users.rows[0].total),
    newUsers: n(users.rows[0].new),
    daily: daily.rows.map((d) => ({ day: d.day, revenue: n(d.revenue), count: n(d.count) })),
    byPlan: byPlan.rows.map((d) => ({ name: d.name, count: n(d.count), revenue: n(d.revenue) })),
    byMode: byMode.rows.map((d) => ({ mode: d.mode, count: n(d.count), revenue: n(d.revenue) })),
  };
}

/* ── Payments ─────────────────────────────────────────────────────── */

export type PayStatus = 'all' | 'success' | 'pending' | 'failed';
export function parsePayStatus(v: string | undefined): PayStatus {
  return v === 'success' || v === 'pending' || v === 'failed' ? v : 'all';
}

export interface PaymentRow {
  id: number;
  txnId: string;
  gatewayTxnId: string | null;
  user: string | null;
  plan: string | null;
  amount: number;
  status: string;
  mode: string | null;
  campaign: string | null;
  pub: string | null;
  clickId: string | null;
  postback: string | null;
  postbackDetail: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listPayments(opts: { status: PayStatus; range: Range; q: string; page: number; affiliate?: boolean }) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.affiliate) conds.push('p.click_id IS NOT NULL');
  if (opts.status !== 'all') {
    params.push(opts.status);
    conds.push(`p.status = $${params.length}`);
  }
  const r = rangeSql('p.created_at', opts.range);
  if (r) conds.push(r);
  if (opts.q) {
    params.push(`%${opts.q}%`);
    const i = params.length;
    conds.push(`(u.mobile ILIKE $${i} OR u.email ILIKE $${i} OR p.txn_id ILIKE $${i} OR p.gateway_txn_id ILIKE $${i} OR p.click_id ILIKE $${i} OR p.pub ILIKE $${i})`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const from = `FROM payments p LEFT JOIN users u ON u.id = p.user_id LEFT JOIN plans pl ON pl.id = p.plan_id ${where}`;

  const offset = (Math.max(1, opts.page) - 1) * PAGE_SIZE;
  const [rows, agg] = await Promise.all([
    pool.query(
      `SELECT p.id, p.txn_id, p.gateway_txn_id, COALESCE(u.mobile, u.email) AS user_id_label, pl.name AS plan,
              p.amount, p.status, ${MODE_SQL} AS mode,
              COALESCE(p.meta_campaign_name, p.campaign_slug) AS campaign, p.pub, p.click_id, p.postback_status, p.postback_response, p.created_at, p.updated_at
       ${from} ORDER BY p.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
      params,
    ),
    pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(p.amount) FILTER (WHERE p.status='success'),0) AS revenue,
              COUNT(*) FILTER (WHERE p.status='success') AS success,
              COUNT(*) FILTER (WHERE p.status='pending') AS pending,
              COUNT(*) FILTER (WHERE p.status='failed') AS failed
       ${from}`,
      params,
    ),
  ]);

  const a = agg.rows[0];
  return {
    rows: rows.rows.map(
      (d): PaymentRow => ({
        id: d.id,
        txnId: d.txn_id,
        gatewayTxnId: d.gateway_txn_id,
        user: d.user_id_label,
        plan: d.plan,
        amount: n(d.amount),
        status: d.status,
        mode: d.mode,
        campaign: d.campaign,
        pub: d.pub,
        clickId: d.click_id,
        postback: d.postback_status,
        postbackDetail: d.postback_response,
        createdAt: new Date(d.created_at).toISOString(),
        updatedAt: new Date(d.updated_at).toISOString(),
      }),
    ),
    total: n(a.total),
    summary: { revenue: n(a.revenue), success: n(a.success), pending: n(a.pending), failed: n(a.failed) },
  };
}

/* ── Subscriptions ────────────────────────────────────────────────── */

export type SubStatus = 'all' | 'active' | 'expiring' | 'expired' | 'cancelled';
export function parseSubStatus(v: string | undefined): SubStatus {
  return v === 'active' || v === 'expiring' || v === 'expired' || v === 'cancelled' ? v : 'all';
}

// Effective status: an 'active' row past its end date counts as expired.
const EFFECTIVE = `CASE
  WHEN s.status = 'cancelled' THEN 'cancelled'
  WHEN s.status = 'active' AND s.end_date > NOW() THEN 'active'
  ELSE 'expired' END`;

export interface SubscriptionRow {
  id: number;
  user: string | null;
  plan: string | null;
  price: number | null;
  startDate: string;
  endDate: string;
  status: string;
  daysLeft: number;
  txnId: string | null;
}

export async function listSubscriptions(opts: { status: SubStatus; q: string; page: number }) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.status === 'expiring') {
    conds.push(`s.status='active' AND s.end_date > NOW() AND s.end_date <= NOW() + INTERVAL '3 days'`);
  } else if (opts.status !== 'all') {
    params.push(opts.status);
    conds.push(`(${EFFECTIVE}) = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q}%`);
    const i = params.length;
    conds.push(`(u.mobile ILIKE $${i} OR u.email ILIKE $${i} OR p.txn_id ILIKE $${i})`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const from = `FROM subscriptions s
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN plans pl ON pl.id = s.plan_id
    LEFT JOIN payments p ON p.id = s.payment_id
    ${where}`;
  const offset = (Math.max(1, opts.page) - 1) * PAGE_SIZE;

  const [rows, agg, counts] = await Promise.all([
    pool.query(
      `SELECT s.id, COALESCE(u.mobile, u.email) AS user_label, pl.name AS plan, pl.price,
              s.start_date, s.end_date, ${EFFECTIVE} AS eff,
              GREATEST(0, CEIL(EXTRACT(EPOCH FROM (s.end_date - NOW())) / 86400))::int AS days_left,
              p.txn_id
       ${from} ORDER BY s.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
      params,
    ),
    pool.query(`SELECT COUNT(*) AS total ${from}`, params),
    pool.query(`
      SELECT
        COUNT(*) AS all,
        COUNT(*) FILTER (WHERE ${EFFECTIVE} = 'active') AS active,
        COUNT(*) FILTER (WHERE s.status='active' AND s.end_date > NOW() AND s.end_date <= NOW() + INTERVAL '3 days') AS expiring,
        COUNT(*) FILTER (WHERE ${EFFECTIVE} = 'expired') AS expired,
        COUNT(*) FILTER (WHERE ${EFFECTIVE} = 'cancelled') AS cancelled
      FROM subscriptions s`),
  ]);

  const c = counts.rows[0];
  return {
    rows: rows.rows.map(
      (d): SubscriptionRow => ({
        id: d.id,
        user: d.user_label,
        plan: d.plan,
        price: d.price === null ? null : n(d.price),
        startDate: new Date(d.start_date).toISOString(),
        endDate: new Date(d.end_date).toISOString(),
        status: d.eff,
        daysLeft: n(d.days_left),
        txnId: d.txn_id,
      }),
    ),
    total: n(agg.rows[0].total),
    counts: {
      all: n(c.all),
      active: n(c.active),
      expiring: n(c.expiring),
      expired: n(c.expired),
      cancelled: n(c.cancelled),
    } as Record<SubStatus, number>,
  };
}
