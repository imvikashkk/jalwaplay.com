import Link from 'next/link';

/**
 * Brand + navigation pieces shared by every page so the whole site
 * reads as one product: logo, footer, and the mobile bottom tab bar.
 */

export const SUPPORT_EMAIL = 'support@dharvix.com';

export const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy', short: 'Privacy' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions', short: 'Terms' },
  { href: '/refund-and-cancellation', label: 'Refund & Cancellation', short: 'Refunds' },
  { href: '/contact', label: 'Contact Us', short: 'Contact' },
];

export function BrandLogo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="focus-ring flex items-center gap-2 rounded-lg shrink-0" aria-label="Jalwaplay home">
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(216,31,63,.7)]"
        style={{ background: 'linear-gradient(135deg, #d81f3f, #ff3b5c)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5v14l11-7L8 5z" fill="white" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight leading-none">
          <span className="text-white">JALWA</span>
          <span className="text-[var(--accent)]">PLAY</span>
        </span>
      )}
    </Link>
  );
}

export function SiteFooter({ withBottomNavSpace = false }: { withBottomNavSpace?: boolean }) {
  return (
    <footer className={`relative z-10 border-t border-white/[0.06] ${withBottomNavSpace ? 'pb-24 md:pb-0' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center md:items-start gap-2">
          <BrandLogo />
          <a href={`mailto:${SUPPORT_EMAIL}`} className="focus-ring rounded text-xs text-white/45 hover:text-white transition-colors">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <nav aria-label="Legal" className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-center sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="focus-ring rounded text-[13px] text-white/55 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="text-center text-[11px] text-white/30 pb-6">© {new Date().getFullYear()} Jalwaplay. All rights reserved.</p>
    </footer>
  );
}

type Tab = 'home' | 'plans' | 'profile';

const TABS: { id: Tab; href: string; label: string; icon: React.ReactNode }[] = [
  {
    id: 'home',
    href: '/',
    label: 'Home',
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />,
  },
  {
    id: 'plans',
    href: '/subscription',
    label: 'Plans',
    icon: (
      <>
        <path d="M12 2 3 7l9 5 9-5-9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
  },
  {
    id: 'profile',
    href: '/profile',
    label: 'Profile',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
  },
];

/** Mobile-only bottom tab bar. */
export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] bg-[#0b0c13]/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`focus-ring flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  on ? 'text-white' : 'text-white/45 hover:text-white/80'
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={on ? 'var(--accent)' : 'currentColor'}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {t.icon}
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
