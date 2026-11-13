import { Chips, Empty, PageTitle, Pagination, SearchBox, StatusPill, fmtDate, hrefWith, inr } from '@/components/admin/ui';
import { PAGE_SIZE, listSubscriptions, parseSubStatus, type SubStatus } from '@/lib/adminData';

export const metadata = { title: 'Subscriptions | Admin' };
type SP = Promise<Record<string, string | undefined>>;

const TABS: { id: SubStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default async function AdminSubscriptions({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = parseSubStatus(sp.status);
  const q = (sp.q ?? '').trim().slice(0, 80);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const { rows, total, counts } = await listSubscriptions({ status, q, page });
  const cur = { status: status === 'all' ? undefined : status, q: q || undefined };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Subscriptions"
        desc="Who has a plan, until when, and how many days are left."
        right={<SearchBox action="/admin/subscriptions" q={q} keep={{ status: cur.status }} placeholder="Search mobile or txn ID" />}
      />

      <Chips
        items={TABS.map((t) => ({
          label: t.label,
          count: counts[t.id],
          href: hrefWith('/admin/subscriptions', cur, { page: undefined, status: t.id === 'all' ? undefined : t.id }),
          active: t.id === status,
        }))}
      />

      {rows.length === 0 ? (
        <Empty title="No subscriptions found" hint={q ? `Nothing matches “${q}”.` : 'Try another filter.'} />
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="md:hidden space-y-2.5">
            {rows.map((s) => {
              const expiring = s.status === 'active' && s.daysLeft <= 3;
              return (
                <li key={s.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{s.user ?? '—'}</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {s.plan ?? '—'}
                        {s.price !== null ? ` · ${inr(s.price)}` : ''}
                      </p>
                    </div>
                    <StatusPill status={expiring ? 'expiring' : s.status} />
                  </div>
                  {s.status === 'active' && (
                    <p className={`mt-3 text-sm font-semibold ${expiring ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {s.daysLeft === 0 ? 'Ends today' : `${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} left`}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-white/40">Started</p>
                      <p className="text-white/75">{fmtDate(s.startDate, false)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40">Ends</p>
                      <p className="text-white/75">{fmtDate(s.endDate, false)}</p>
                    </div>
                    {s.txnId && (
                      <div className="col-span-2 min-w-0">
                        <p className="text-white/40">Payment</p>
                        <p className="font-mono text-white/75 truncate">{s.txnId}</p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Started</th>
                  <th className="px-4 py-3 font-semibold">Ends</th>
                  <th className="px-4 py-3 font-semibold text-right">Days left</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((s) => {
                  const expiring = s.status === 'active' && s.daysLeft <= 3;
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{s.user ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {s.plan ?? '—'}
                        {s.price !== null && <span className="text-white/40"> · {inr(s.price)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={expiring ? 'expiring' : s.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/70">{fmtDate(s.startDate, false)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/70">{fmtDate(s.endDate, false)}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${s.status !== 'active' ? 'text-white/30' : expiring ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {s.status === 'active' ? s.daysLeft : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/60">{s.txnId ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(p) => hrefWith('/admin/subscriptions', cur, { page: String(p) })} />
        </>
      )}
    </div>
  );
}
