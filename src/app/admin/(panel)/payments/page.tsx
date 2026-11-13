import { Chips, Empty, PageTitle, Pagination, SearchBox, StatusPill, fmtDate, hrefWith, inr } from '@/components/admin/ui';
import { PAGE_SIZE, RANGES, listPayments, parsePayStatus, parseRange } from '@/lib/adminData';

export const metadata = { title: 'Payments | Admin' };
type SP = Promise<Record<string, string | undefined>>;

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'success', label: 'Success' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
] as const;

export default async function AdminPayments({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = parsePayStatus(sp.status);
  const range = parseRange(sp.range, 'all');
  const q = (sp.q ?? '').trim().slice(0, 80);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const affiliate = sp.aff === '1';

  const { rows, total, summary } = await listPayments({ status, range, q, page, affiliate });
  const cur = {
    status: status === 'all' ? undefined : status,
    range: range === 'all' ? undefined : range,
    q: q || undefined,
    aff: affiliate ? '1' : undefined,
  };
  const H = (over: Record<string, string | undefined>) => hrefWith('/admin/payments', cur, { page: undefined, ...over });

  return (
    <div className="space-y-5">
      <PageTitle
        title="Payments"
        desc="Every payment attempt — who paid, which plan, and its status."
        right={<SearchBox action="/admin/payments" q={q} keep={{ status: cur.status, range: cur.range, aff: cur.aff }} placeholder="Search mobile, txn or click ID" />}
      />

      {/* Summary for current filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { k: 'Collected', v: inr(summary.revenue), c: 'text-white' },
          { k: 'Success', v: summary.success, c: 'text-emerald-400' },
          { k: 'Pending', v: summary.pending, c: 'text-amber-400' },
          { k: 'Failed', v: summary.failed, c: 'text-red-400' },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
            <p className="text-[11px] text-white/45">{s.k}</p>
            <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <Chips
          items={STATUSES.map((s) => ({
            label: s.label,
            href: H({ status: s.id === 'all' ? undefined : s.id }),
            active: s.id === status,
          }))}
        />
        <Chips
          items={[
            ...RANGES.map((r) => ({ label: r.label, href: H({ range: r.id === 'all' ? undefined : r.id }), active: r.id === range })),
            { label: 'Affiliate only', href: H({ aff: affiliate ? undefined : '1' }), active: affiliate },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <Empty title="No payments found" hint={q ? `Nothing matches “${q}”.` : 'Try another filter.'} />
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="md:hidden space-y-2.5">
            {rows.map((p) => (
              <li key={p.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold truncate">{p.user ?? '—'}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {p.plan ?? '—'}
                      {p.mode ? ` · ${p.mode}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold tabular-nums leading-tight">{inr(p.amount)}</p>
                    <div className="mt-1">
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div className="min-w-0">
                    <p className="text-white/40">Txn ID</p>
                    <p className="font-mono text-white/75 truncate">{p.txnId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Date</p>
                    <p className="text-white/75">{fmtDate(p.createdAt)}</p>
                  </div>
                  {p.campaign && (
                    <div className="col-span-2 min-w-0">
                      <p className="text-white/40">Campaign</p>
                      <p className="text-white/75 truncate">{p.campaign}</p>
                    </div>
                  )}
                  {p.clickId && (
                    <div className="col-span-2 min-w-0">
                      <p className="text-white/40">Affiliate</p>
                      <AffiliateCell pub={p.pub} clickId={p.clickId} postback={p.postback} detail={p.postbackDetail} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Txn ID</th>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Affiliate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 whitespace-nowrap text-white/70">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{p.user ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.plan ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{inr(p.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-white/70">{p.mode ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-white/75">{p.txnId}</span>
                      {p.gatewayTxnId && <span className="block font-mono text-[11px] text-white/40">GW: {p.gatewayTxnId}</span>}
                    </td>
                    <td className="px-4 py-3 text-white/60 max-w-[160px] truncate">{p.campaign ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {p.clickId ? (
                        <AffiliateCell pub={p.pub} clickId={p.clickId} postback={p.postback} detail={p.postbackDetail} />
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(p) => hrefWith('/admin/payments', cur, { page: String(p) })} />
        </>
      )}
    </div>
  );
}

const POSTBACK_LABEL: Record<string, { text: string; cls: string }> = {
  sent: { text: 'Postback sent', cls: 'text-emerald-400' },
  failed: { text: 'Postback failed', cls: 'text-red-400' },
  sending: { text: 'Sending…', cls: 'text-amber-400' },
};

function AffiliateCell({ pub, clickId, postback, detail }: { pub: string | null; clickId: string; postback: string | null; detail: string | null }) {
  const pb = postback ? POSTBACK_LABEL[postback] : null;
  return (
    <div className="min-w-0 text-[11px] leading-snug">
      <p className="text-white/75 truncate">
        {pub && <span className="font-semibold">pub {pub} · </span>}
        <span className="font-mono">{clickId}</span>
      </p>
      {pb ? (
        <p className={pb.cls} title={detail ?? undefined}>
          {pb.text}
        </p>
      ) : (
        <p className="text-white/35">No postback</p>
      )}
    </div>
  );
}
