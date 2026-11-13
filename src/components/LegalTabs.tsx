'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEGAL_LINKS } from './SiteChrome';

/** Pill tabs to hop between the legal / help pages. */
export default function LegalTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Policies" className="no-scrollbar -mx-4 px-4 flex gap-2 overflow-x-auto">
      {LEGAL_LINKS.map((l) => {
        const on = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? 'page' : undefined}
            className={`focus-ring shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold border transition-colors ${
              on ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {l.short}
          </Link>
        );
      })}
    </nav>
  );
}
