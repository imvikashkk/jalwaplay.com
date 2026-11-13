import Link from 'next/link';
import type { ReactNode } from 'react';

/* Small server-safe building blocks for the admin panel. */

export const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

export function fmtDate(iso: string, withTime = true) {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: withTime ? undefined : 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  });
}

type Params = Record<string, string | undefined>;

/** Build `/path?..` keeping current params, applying overrides (undefined/'' removes). */
export function hrefWith(path: string, current: Params, over: Params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...over })) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}

const STATUS_STYLE: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  expiring: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  failed: 'bg-red-500/15 text-red-400 ring-red-500/30',
  expired: 'bg-white/5 text-white/50 ring-white/15',
  cancelled: 'bg-red-500/10 text-red-300 ring-red-500/25',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
        STATUS_STYLE[status] ?? 'bg-white/5 text-white/60 ring-white/15'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  href,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warn' | 'danger';
  href?: string;
}) {
  const ring = {
    default: 'border-white/[0.08]',
    accent: 'border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/[0.14] to-transparent',
    success: 'border-emerald-500/25',
    warn: 'border-amber-500/25',
    danger: 'border-red-500/25',
  }[tone];
  const dot = {
    default: 'bg-white/30',
    accent: 'bg-[var(--accent)]',
    success: 'bg-emerald-400',
    warn: 'bg-amber-400',
    danger: 'bg-red-400',
  }[tone];
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 text-2xl sm:text-[28px] font-extrabold tracking-tight tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-white/45">{hint}</p>}
    </>
  );
  const cls = `block rounded-2xl border bg-white/[0.03] p-4 ${ring}`;
  return href ? (
    <Link href={href} className={`${cls} focus-ring hover:bg-white/[0.06] transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Chips({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <div className="no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto">
      {items.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          aria-current={c.active ? 'true' : undefined}
          className={`focus-ring shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold border transition-colors ${
            c.active ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/70 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          {c.label}
          {c.count !== undefined && (
            <span className={`text-[11px] tabular-nums ${c.active ? 'text-black/55' : 'text-white/40'}`}>{c.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

/** GET search form; keeps the other filters as hidden inputs. */
export function SearchBox({ action, q, keep, placeholder }: { action: string; q: string; keep: Params; placeholder: string }) {
  return (
    <form action={action} method="get" role="search" className="relative w-full sm:max-w-xs">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-3 py-2.5 text-base sm:text-sm placeholder:text-white/35 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
      />
    </form>
  );
}

export function Pagination({ page, total, pageSize, hrefFor }: { page: number; total: number; pageSize: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = 'btn-ghost h-9 px-3.5 rounded-full text-xs';
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-xs text-white/45 tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={btn}>
            ← Prev
          </Link>
        ) : (
          <span className={`${btn} opacity-30`}>← Prev</span>
        )}
        {page < pages ? (
          <Link href={hrefFor(page + 1)} className={btn}>
            Next →
          </Link>
        ) : (
          <span className={`${btn} opacity-30`}>Next →</span>
        )}
      </div>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
      <p className="text-sm font-semibold text-white/70">{title}</p>
      {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

export function PageTitle({ title, desc, right }: { title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-white/50 mt-1">{desc}</p>}
      </div>
      {right}
    </div>
  );
}
