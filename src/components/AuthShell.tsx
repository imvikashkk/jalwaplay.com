import Link from 'next/link';
import type { ReactNode } from 'react';
import BackForwardReload from './BackForwardReload';

/**
 * Shared layout for the Login screen (and its Suspense fallback):
 * cinematic background image, glass card, and on desktop a pitch column
 * (headline + feature pills) on the left with the form on the right.
 */

export const BRAND_GRADIENT = 'linear-gradient(135deg, #d81f3f, #ff3b5c)';
export const ACCENT = '#ff3b5c';
export const SUCCESS = '#1D9E75';
export const ERROR = '#e74c3c';

const SHELL_CSS = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideDown{ from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake    { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
  @keyframes floatGlow{ 0%,100% { opacity: .9; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
  @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

  .animate-fadeInUp { animation: fadeInUp .6s cubic-bezier(.22,1,.36,1) both; }
  .animate-fadeIn   { animation: fadeIn .35s ease-out both; }
  .animate-slideDown{ animation: slideDown .25s ease-out both; }
  .shake            { animation: shake .4s ease-in-out; }
  .live-dot         { animation: pulseDot 1.6s ease-in-out infinite; }

  .auth-card {
    position: relative;
    background: linear-gradient(180deg, rgba(20,22,34,.42) 0%, rgba(12,14,22,.55) 100%);
    border: 1px solid rgba(255,255,255,0.10);
    backdrop-filter: blur(14px) saturate(130%);
    -webkit-backdrop-filter: blur(14px) saturate(130%);
    box-shadow: 0 40px 80px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .auth-card::before {
    content: ''; position: absolute; top: -1px; left: 18%; right: 18%; height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
  }
  .auth-feature { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }

  .brand-mark { box-shadow: 0 8px 24px -8px rgba(216,31,63,.6); animation: floatGlow 4s ease-in-out infinite; }

  .auth-btn {
    background: ${BRAND_GRADIENT};
    transition: transform .2s ease, box-shadow .3s ease, opacity .2s ease, filter .2s ease;
  }
  .auth-btn:not(:disabled) { box-shadow: 0 4px 24px rgba(216,31,63,.4); }
  .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(216,31,63,.55); }
  .auth-btn:active:not(:disabled) { transform: scale(.98); }
  .auth-btn:disabled { opacity: .5; cursor: not-allowed; }
  .auth-btn:focus-visible, .auth-link:focus-visible {
    outline: 2px solid ${ACCENT}; outline-offset: 2px;
  }
  .auth-btn.success-btn { background: linear-gradient(135deg, #27ae60, #1e8449) !important; box-shadow: 0 4px 20px rgba(39,174,96,.5) !important; }

  .auth-field { transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  }
`;

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Inline error / info banner with a gentle slide-in. */
export function FormAlert({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' | 'info' }) {
  if (!message) return null;
  const color = tone === 'error' ? ERROR : tone === 'success' ? '#2ecc71' : 'rgba(255,255,255,.7)';
  const bg =
    tone === 'error' ? 'rgba(231,76,60,0.10)' : tone === 'success' ? 'rgba(46,204,113,0.10)' : 'rgba(255,255,255,0.05)';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className="animate-slideDown flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium leading-relaxed"
      style={{ background: bg, border: `1px solid ${color}40`, color }}
    >
      <span aria-hidden="true" className="mt-px">
        {tone === 'error' ? '⚠' : tone === 'success' ? '✓' : 'ℹ'}
      </span>
      <span>{message}</span>
    </div>
  );
}

export function BrandLogo() {
  return (
    <Link href="/" className="auth-link flex items-center gap-2 rounded-lg" aria-label="Jalwaplay home">
      <div className="brand-mark w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: BRAND_GRADIENT }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5v14l11-7L8 5z" fill="white" />
        </svg>
      </div>
      <div>
        <span className="text-xl font-bold tracking-tight text-white">JALWA</span>
        &nbsp;
        <span className="text-xl font-bold tracking-tight" style={{ color: ACCENT }}>
          PLAY
        </span>
      </div>
    </Link>
  );
}

function Footer() {
  const links = [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-and-conditions', label: 'Terms & Conditions' },
    { href: '/refund-and-cancellation', label: 'Refund & Cancellation' },
    { href: '/contact', label: 'Contact Us' },
  ];
  return (
    <footer className="relative z-10 border-t border-white/5 py-5 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/45">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5" aria-label="Legal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="auth-link hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-white/35">© {new Date().getFullYear()} Jalwaplay. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden text-white flex flex-col" style={{ background: '#0b0f19' }}>
      <style>{SHELL_CSS}</style>
      {/* Back/forward from a logged-in page re-runs the auth guard instead of showing a stale form */}
      <BackForwardReload />

      {/* ── Background image ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/background/authpage_bg.png')" }}
      />

      {/* Overlays: keep the image as mood, not as the focus — the form must stay readable */}
      <div className="absolute inset-0" style={{ background: 'rgba(7, 9, 15, 0.3)' }} />
      {/* Mobile: darken evenly behind the centred card */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: 'linear-gradient(180deg, rgba(7,9,15,.1) 0%, rgba(7,9,15,.35) 50%, rgba(7,9,15,.8) 100%)' }}
      />
      {/* Desktop: image stays visible on the left, fades behind the form on the right */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: 'linear-gradient(90deg, rgba(7,9,15,.15) 0%, rgba(7,9,15,.45) 50%, rgba(7,9,15,.75) 80%)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 80% 50%, rgba(233, 30, 60, 0.14) 0%, transparent 70%),
            linear-gradient(0deg, rgba(7,9,15,.9) 0%, transparent 25%)
          `,
        }}
      />

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-4 sm:px-8 py-8 sm:py-10">
        {/* Desktop-only pitch column */}
        <section className="hidden lg:flex flex-col gap-7 animate-fadeInUp">
          <BrandLogo />
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
              Unlimited movies
              <br />
              &amp; web series.{' '}
              <span style={{ color: ACCENT }}>Anytime.</span>
            </h2>
            <p className="text-base text-white/65 max-w-md leading-relaxed">
              Stream exclusive originals in HD on any device. New releases every week.
            </p>
          </div>
          <ul className="flex flex-wrap gap-3">
            {['HD streaming', 'New every week', 'Watch on any device', 'Cancel anytime'].map((f) => (
              <li key={f} className="auth-feature flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/85">
                <span style={{ color: ACCENT }} aria-hidden="true">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full min-w-0 max-w-md mx-auto lg:mr-0 animate-fadeInUp space-y-6">
          <div className="flex justify-center lg:hidden">
            <BrandLogo />
          </div>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** Loading placeholder used while client pages hydrate (Suspense fallback). */
export function AuthShellFallback() {
  return (
    <AuthShell>
      <div className="auth-card rounded-2xl p-8 flex items-center justify-center" style={{ minHeight: 280 }}>
        <Spinner size={28} />
      </div>
    </AuthShell>
  );
}
