import Link from 'next/link';
import { Chips, PageTitle, StatCard, StatusPill, fmtDate, hrefWith, inr } from '@/components/admin/ui';
import { RANGES, getOverview, listPayments, parseRange } from '@/lib/adminData';

type SP = Promise<Record<string, string | undefined>>;

export default async function AdminOverview({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const range = parseRange(sp.range, '30d');
  const [o, recent] = await Promise.all([getOverview(range), listPayments({ status: 'all', range: 'all', q: '', page: 1 })]);

  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? '';
  const maxDay = Math.max(1, ...o.daily.map((d) => d.revenue));
  const maxPlan = Math.max(1, ...o.byPlan.map((p) => p.revenue));
  const conv = o.totalCount ? Math.round((o.successCount / o.totalCount) * 100) : 0;
  const payHref = (status: string) => hrefWith('/admin/payments', {}, { status, range });

  return (
    <div className="space-y-6">
      <PageTitle title="Overview" desc={`Revenue and payments · ${rangeLabel}`} />

      <Chips items={RANGES.map((r) => ({ label: r.label, href: hrefWith('/admin', {}, { range: r.id }), active: r.id === range }))} />

      {/* Headline numbers */}
      <section className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="col-span-3 lg:col-span-1">
          <StatCard
            tone="accent"
            label="Revenue"
            value={inr(o.revenue)}
            hint={`${o.successCount} successful payments`}
            href={payHref('success')}
          />
        </div>
        <StatCard tone="success" label="Successful" value={String(o.successCount)} hint={`${conv}% of attempts`} href={payHref('success')} />
        <StatCard tone="warn" label="Pending" value={String(o.pendingCount)} hint={`${inr(o.pendingAmount)} waiting`} href={payHref('pending')} />
        <StatCard tone="danger" label="Failed" value={String(o.failedCount)} hint={`${o.totalCount} total attempts`} href={payHref('failed')} />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today" value={inr(o.todayRevenue)} hint="Revenue since midnight (IST)" />
        <StatCard label="This month" value={inr(o.monthRevenue)} hint="Revenue this calendar month" />
        <StatCard
          label="Active subs"
          value={String(o.activeSubs)}
          hint={o.expiringSoon ? `${o.expiringSoon} expiring in 3 days` : 'None expiring soon'}
          href="/admin/subscriptions?status=active"
        />
        <StatCard label="Users" value={String(o.totalUsers)} hint={`${o.newUsers} new · ${rangeLabel.toLowerCase()}`} />
      </section>

      {/* Daily revenue chart */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Daily revenue</h2>
          <p className="text-xs text-white/45">Last 14 days</p>
        </div>
        <div className="mt-4 flex items-end gap-1 sm:gap-2 h-40" role="img" aria-label="Daily revenue for the last 14 days">
          {o.daily.map((d) => {
            const h = (d.revenue / maxDay) * 100;
            const label = new Date(`${d.day}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
            return (
              <div key={d.day} className="group relative flex-1 h-full flex flex-col justify-end items-center">
                <div
                  className={`w-full rounded-t-md transition-colors ${d.revenue ? 'bg-[var(--accent)]/80 group-hover:bg-[var(--accent)]' : 'bg-white/[0.06]'}`}
                  style={{ height: `${Math.max(d.revenue ? 4 : 2, h)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-black/90 border border-white/10 px-2 py-1 text-[11px] z-10">
                  <span className="font-semibold">{inr(d.revenue)}</span> · {d.count} paid · {label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/35 tabular-nums">
          <span>{new Date(`${o.daily[0]?.day}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* By plan */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Revenue by plan</h2>
          <p className="text-xs text-white/45">{rangeLabel}</p>
          <ul className="mt-4 space-y-3.5">
            {o.byPlan.map((p) => (
              <li key={p.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{inr(p.revenue)}</span>
                    <span className="text-white/40 text-xs"> · {p.count} sold</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#d81f3f] to-[#ff3b5c]" style={{ width: `${(p.revenue / maxPlan) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* By payment method */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Payment methods</h2>
          <p className="text-xs text-white/45">Successful payments · {rangeLabel}</p>
          {o.byMode.length === 0 ? (
            <p className="mt-6 text-sm text-white/40">No successful payments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {o.byMode.map((m) => (
                <li key={m.mode} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{m.mode}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{inr(m.revenue)}</span>
                    <span className="text-white/40 text-xs"> · {m.count}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent payments */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-2 sm:pb-3">
          <h2 className="text-sm font-semibold">Latest payments</h2>
          <Link href="/admin/payments" className="text-xs font-semibold text-[#ff8da0] hover:text-white">
            View all →
          </Link>
        </div>
        {recent.rows.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-white/40">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {recent.rows.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.user ?? '—'}</p>
                  <p className="text-[11px] text-white/45 truncate">
                    {p.plan ?? '—'} · {fmtDate(p.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-bold tabular-nums">{inr(p.amount)}</p>
                  <StatusPill status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
