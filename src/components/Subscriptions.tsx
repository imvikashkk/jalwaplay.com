'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PaymentModal, { type PaymentData } from './PaymentModal';
import { PosterRail, ROW_TOP } from './PosterRail';
import { BrandLogo } from './SiteChrome';
import { getAttribution, logout } from '@/lib/clientSession';

// Badge per plan index (API order: cheapest first).
const BADGES: (string | null)[] = [null, 'Most popular', 'Best value', 'Best deal'];

const PERKS = ['Unlimited movies & web series', 'HD streaming on any device', 'New originals every week', 'Cancel anytime'];

interface ApiPlan {
  id: number;
  name: string;
  price: number;
  original_price: number;
  duration_days: number;
  description: string;
}

interface Plan extends ApiPlan {
  index: number;
  badge: string | null;
  duration: string;
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)} Year`;
  if (days >= 30)
    return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${days} Days`;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const sel = plans.find((p) => p.id === selected) ?? null;

  const loadPlans = useCallback(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: Plan[] = data.data.map((p: ApiPlan, i: number) => ({
            ...p,
            index: i,
            duration: formatDuration(p.duration_days),
            badge: BADGES[i] ?? null,
          }));
          setPlans(mapped);
          setSelected((cur) =>
            cur && mapped.some((p) => p.id === cur) ? cur : (mapped[1]?.id ?? mapped[0]?.id ?? null),
          );
        } else {
          setLoadError(data.success ? 'No plans are available right now.' : 'Could not load plans.');
        }
      })
      .catch(() => setLoadError('Network error. Could not load plans.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Re-validate the session (also refreshes the subscription cookie)
    fetch('/api/auth/session')
      .then(async (r) => {
        if (r.status === 401) {
          // Token invalid/expired — force re-login
          await logout('/auth');
          return;
        }
        const data = await r.json();
        if (data.success && data.data.hasActiveSub) setIsSubscribed(true);
      })
      .catch(() => setIsSubscribed(false));

    loadPlans();
  }, [loadPlans]);

  const handleLogout = () => logout('/auth');

  const handlePay = async () => {
    setError('');

    if (!selected) {
      setError('Please select a plan first.');
      return;
    }

    setPaying(true);
    try {
      const attr = getAttribution();
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selected,
          fbp: attr.fbp,
          fbc: attr.fbc,
          campaignSlug: attr.campaignSlug,
          metaCampaignId: attr.metaCampaignId || null,
          metaCampaignName: attr.metaCampaignName || null,
        }),
      });
      if (res.status === 401) {
        await logout('/auth');
        return;
      }
      const data = await res.json();
      if (data.success && data.data.gateway === 'sabpaisa') {
        // Keep the button in its loading state while the browser leaves for SabPaisa.
        window.location.href = data.data.redirectUrl;
      } else if (data.success) {
        // Demo account: simulated payment modal
        setPaymentData(data.data);
        setPaying(false);
      } else {
        setError(data.message ?? 'Payment failed. Try again.');
        setPaying(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setPaying(false);
    }
  };


  const perDay = (p: Plan) => {
    const v = p.price / p.duration_days;
    return v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v));
  };
  const cheapestPerDay = plans.length ? Math.min(...plans.map((p) => p.price / p.duration_days)) : 0;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)] text-white">
      {paymentData && (
        <PaymentModal data={paymentData} onCloseAction={() => { setPaymentData(null); setPaying(false); }} />
      )}

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(216,31,63,.22), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,59,92,.08), transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative z-20 max-w-5xl mx-auto h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between">
        {isSubscribed ? (
          <Link href="/" className="focus-ring btn-ghost h-9 px-3 rounded-full text-xs" aria-label="Back to home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Home
          </Link>
        ) : (
          <BrandLogo href="/subscription" />
        )}
        <button onClick={handleLogout} className="btn-ghost h-9 px-3.5 rounded-full text-xs">
          Log out
        </button>
      </header>

      <main className="relative z-10 pb-44 md:pb-16">
        {/* Poster strip */}
        <div className="pt-1 pb-4 sm:pb-6">
          <PosterRail posters={ROW_TOP} direction="left" priority />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          {/* Heading */}
          <div className="anim-fade-up text-center max-w-lg mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold bg-[var(--accent)]/15 text-[#ff8da0] border border-[var(--accent)]/30">
              <span aria-hidden="true">🔥</span> गरमा गरम ! · Premium
            </span>
            <h1 className="mt-3 text-[28px] sm:text-4xl font-extrabold tracking-tight leading-tight">
              Choose your <span className="text-[var(--accent)]">plan</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/55">Unlimited content · Kabhi bhi · Cancel anytime</p>
          </div>

          {loadError && !loading && (
            <div className="mt-6 max-w-md mx-auto rounded-2xl px-4 py-4 text-center bg-red-500/10 border border-red-500/30" role="alert">
              <p className="text-[13px] text-red-300 mb-3">{loadError}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setLoadError('');
                  loadPlans();
                }}
                className="btn-ghost px-4 py-1.5 rounded-full text-xs"
              >
                Try again
              </button>
            </div>
          )}

          {/* Plans: stacked list on mobile, 4 columns on desktop */}
          <div
            className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 max-w-md md:max-w-none mx-auto"
            role="radiogroup"
            aria-label="Subscription plans"
          >
            {loading &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[76px] md:h-[220px] rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
              ))}

            {!loading &&
              plans.map((plan, i) => {
                const isSel = selected === plan.id;
                const off =
                  plan.original_price > plan.price
                    ? Math.round(((plan.original_price - plan.price) / plan.original_price) * 100)
                    : 0;
                const best = plan.price / plan.duration_days === cheapestPerDay;
                return (
                  <div
                    key={plan.id}
                    role="radio"
                    aria-checked={isSel}
                    tabIndex={isSel || (!sel && i === 0) ? 0 : -1}
                    onClick={() => setSelected(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(plan.id);
                      }
                      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
                        const next = plans[(i + d + plans.length) % plans.length];
                        setSelected(next.id);
                        (e.currentTarget.parentElement?.children[(i + d + plans.length) % plans.length] as HTMLElement | undefined)?.focus();
                      }
                    }}
                    className={`anim-fade-up focus-ring relative cursor-pointer select-none rounded-2xl border transition-all duration-300 ${
                      isSel
                        ? 'border-[var(--accent)] bg-gradient-to-br from-[var(--accent)]/[0.18] to-white/[0.03] shadow-[0_20px_50px_-20px_rgba(255,59,92,.6)]'
                        : 'border-white/[0.08] bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {plan.badge && (
                      <span
                        className={`absolute -top-2.5 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isSel ? 'bg-[var(--accent)] text-white' : 'bg-white text-black'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div className="flex md:flex-col items-center md:items-stretch gap-3 md:gap-4 p-4 md:p-5">
                      {/* Radio */}
                      <span
                        className={`md:order-last md:self-center shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSel ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-white/25'
                        }`}
                        aria-hidden="true"
                      >
                        {isSel && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </span>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0 md:text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{plan.duration}</p>
                        <p className="text-base font-bold leading-tight mt-0.5">{plan.name}</p>
                        <p className="text-xs text-white/50 mt-1 line-clamp-2">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-right md:text-center shrink-0">
                        {off > 0 && (
                          <p className="text-[11px] text-white/40">
                            <span className="line-through">₹{plan.original_price}</span>{' '}
                            <span className="text-emerald-400 font-semibold">{off}% off</span>
                          </p>
                        )}
                        <p className={`text-2xl md:text-4xl font-extrabold leading-none tracking-tight ${isSel ? 'text-white' : 'text-white/85'}`}>
                          ₹{plan.price}
                        </p>
                        <p className={`text-[11px] mt-1 ${best ? 'text-emerald-400 font-semibold' : 'text-white/40'}`}>
                          ₹{perDay(plan)}/day
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Perks */}
          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-md md:max-w-none mx-auto">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-xs text-white/70">
                <span className="mt-px text-emerald-400" aria-hidden="true">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>

          {/* Desktop CTA (mobile uses the sticky bar) */}
          <div className="hidden md:flex flex-col items-center gap-3 mt-10">
            {error && (
              <p className="text-sm text-red-400" role="alert">
                ⚠ {error}
              </p>
            )}
            <button onClick={handlePay} disabled={paying || loading || !sel} className="btn-primary min-w-[320px] rounded-full px-8 py-4 text-base">
              {paying ? (
                <>
                  <Spinner /> Processing…
                </>
              ) : (
                <>Continue with {sel?.name ?? 'plan'} · ₹{sel?.price ?? ''}</>
              )}
            </button>
            <TrustLine />
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0b0c13]/90 backdrop-blur-xl px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        {error && (
          <p className="text-xs text-red-400 text-center mb-2" role="alert">
            ⚠ {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45 truncate">{sel ? `${sel.name} · ${sel.duration}` : 'Select a plan'}</p>
            <p className="text-xl font-extrabold leading-tight">{sel ? `₹${sel.price}` : '—'}</p>
          </div>
          <button onClick={handlePay} disabled={paying || loading || !sel} className="btn-primary rounded-2xl px-6 py-3.5 text-sm shrink-0">
            {paying ? (
              <>
                <Spinner /> Processing…
              </>
            ) : (
              <>
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </div>
        <div className="mt-2">
          <TrustLine />
        </div>
      </div>
    </div>
  );
}

function TrustLine() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      Secure payment · Instant access · Cancel anytime
    </p>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
