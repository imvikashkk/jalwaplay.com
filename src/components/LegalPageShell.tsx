import Link from 'next/link';
import type { ReactNode } from 'react';
import LegalTabs from './LegalTabs';
import { BrandLogo, SiteFooter } from './SiteChrome';

/**
 * Layout for Privacy / Terms / Refund / Contact.
 * Pages pass plain <h1>, <section><h2/><p/></section> markup; the typography
 * below styles it so every policy page reads the same.
 */
export default function LegalPageShell({ children, backHref = '/' }: { children: ReactNode; backHref?: string }) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[var(--bg)] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(216,31,63,.18), transparent 70%)' }}
      />

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto h-14 sm:h-16 px-4 flex items-center justify-between">
          <BrandLogo />
          <Link href={backHref} className="btn-ghost h-9 px-3.5 rounded-full text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 pt-5 pb-14">
        <LegalTabs />

        <article
          className="anim-fade-up mt-6 text-white/75
            [&>div:first-child]:pb-6 [&>div:first-child]:mb-2 [&>div:first-child]:border-b [&>div:first-child]:border-white/[0.08]
            [&_h1]:!mt-0 [&_h1]:text-[28px] sm:[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-white
            [&_section]:py-5 [&_section]:border-b [&_section]:border-white/[0.06] [&_section:last-child]:border-b-0
            [&_h2]:text-base sm:[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white
            [&_p]:text-[15px] [&_p]:leading-7 [&_li]:text-[15px] [&_li]:leading-7
            [&_ul]:!list-outside [&_ul]:!pl-5 [&_ul]:!space-y-1.5 [&_li]:marker:text-[var(--accent)]
            [&_a]:text-[#ff7a90] [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-white"
        >
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
