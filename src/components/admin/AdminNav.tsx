'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const ITEMS = [
  {
    href: '/admin',
    label: 'Overview',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
  },
  {
    href: '/admin/subscriptions',
    label: 'Subscriptions',
    icon: (
      <>
        <path d="M12 2 3 7l9 5 9-5-9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

/** Sidebar on desktop, bottom tab bar on mobile. */
export function AdminNav({ variant }: { variant: 'side' | 'bottom' }) {
  const pathname = usePathname();

  if (variant === 'bottom') {
    return (
      <nav
        aria-label="Admin"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] bg-[#0b0c13]/90 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-3">
          {ITEMS.map((it) => {
            const on = isActive(pathname, it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={on ? 'page' : undefined}
                  className={`focus-ring flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${on ? 'text-white' : 'text-white/45'}`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--accent)' : 'currentColor'} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {it.icon}
                  </svg>
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Admin" className="space-y-1">
      {ITEMS.map((it) => {
        const on = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              on ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={on ? 'var(--accent)' : 'currentColor'} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {it.icon}
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLogout({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
        window.location.replace('/admin/login');
      }}
      disabled={busy}
      className={`btn-ghost rounded-full text-xs disabled:opacity-50 ${compact ? 'h-9 px-3.5' : 'w-full h-10'}`}
    >
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  );
}
