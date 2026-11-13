'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/clientSession';
import { BottomNav, BrandLogo, LEGAL_LINKS, SUPPORT_EMAIL } from './SiteChrome';

interface UserProfile {
  mobile: string | null;
  email?: string | null;
  plan_name: string | null;
  plan_price: number | null;
  duration_days: number | null;
  end_date: string | null;
  sub_status: string | null;
  days_left: number | null;
}

const CACHE_KEY = 'mr_profile';

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(days: number | null) {
  if (!days) return null;
  if (days >= 365) return `${Math.round(days / 365)} Year`;
  if (days >= 30)
    return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${days} Days`;
}

function readCache(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(data: UserProfile) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export default function ProfilePage() {
  const [showLogout, setShowLogout] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // ✅ useLayoutEffect — browser paint se PEHLE chalta hai (synchronous flush)
  // Server pe nahi chalta, sirf client pe — isliye SSR mismatch nahi hoga
  // Agar cache hai → skeleton kabhi user ko dikhta hi nahi
  useLayoutEffect(() => {
    const cached = readCache();
    if (cached) {
      setProfile(cached);
      setLoading(false);
      setFromCache(true);
    }
  }, []);

  useEffect(() => {
    let mobile: string | null = null;
    let email: string | null = null;
    try {
      mobile = localStorage.getItem('mr_mobile');
      email = localStorage.getItem('mr_email');
    } catch {}

    // Cache se data aa gaya → network call skip
    if (profile !== null) return;

    fetch('/api/user/profile')
      .then(async (r) => {
        if (r.status === 401) {
          await logout('/auth');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          setProfile(data.data);
          writeCache(data.data);
        } else {
          setProfile({
            mobile,
            email,
            plan_name: null,
            plan_price: null,
            duration_days: null,
            end_date: null,
            sub_status: null,
            days_left: null,
          });
        }
      })
      .catch(() => {
        setProfile({
          mobile,
          email,
          plan_name: null,
          plan_price: null,
          duration_days: null,
          end_date: null,
          sub_status: null,
          days_left: null,
        });
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => logout('/auth');

  // Renew / subscribe goes through the plans page (plan choice + UPI modal).
  const handleRenew = () => {
    setPaying(true);
    window.location.href = '/subscription';
  };

  const hasSub = !!(profile?.plan_name && profile?.sub_status === 'active');
  const daysLeft = profile?.days_left ?? null;
  const total = profile?.duration_days ?? null;
  const pct = hasSub && daysLeft !== null && total ? Math.max(4, Math.min(100, (daysLeft / total) * 100)) : 0;
  const lowDays = daysLeft !== null && daysLeft <= 3;
  const mobileFmt = profile?.mobile ? `+91 ${profile.mobile.slice(0, 5)} ${profile.mobile.slice(5)}` : null;
  const anim = fromCache ? '' : 'anim-fade-up';

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)] text-white">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(216,31,63,.2), transparent 70%)' }}
      />

      <header className="relative z-10 max-w-lg mx-auto h-14 sm:h-16 px-4 flex items-center justify-between">
        <Link href="/" className="btn-ghost h-9 px-3 rounded-full text-xs" aria-label="Back to home">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Home
        </Link>
        <BrandLogo compact />
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-2 pb-28 md:pb-12 space-y-4">
        {/* Identity */}
        <section className={`${anim} glass rounded-3xl p-5 flex items-center gap-4`}>
          <div
            className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(255,59,92,.8)]"
            style={{ background: 'linear-gradient(135deg,#d81f3f,#ff3b5c)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">My account</p>
            {loading ? (
              <div className="animate-pulse h-6 w-40 rounded-lg bg-white/10 mt-1.5" />
            ) : (
              <p className="text-[17px] font-bold tracking-wide break-all leading-tight mt-1">{mobileFmt ?? profile?.email ?? '—'}</p>
            )}
            {!loading && (
              <span
                className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  hasSub ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                {hasSub ? 'Premium member' : 'Free account'}
              </span>
            )}
          </div>
        </section>

        {/* Subscription */}
        <section
          className={`${anim} relative overflow-hidden rounded-3xl p-5 border border-[var(--accent)]/25`}
          style={{ background: 'linear-gradient(145deg, rgba(255,59,92,.16), rgba(15,17,25,.9) 55%)', animationDelay: '60ms' }}
        >
          <p className="eyebrow">Current subscription</p>
          {loading ? (
            <div className="space-y-2 mt-3">
              <div className="animate-pulse h-7 w-36 rounded-lg bg-white/10" />
              <div className="animate-pulse h-2 w-full rounded-full bg-white/10" />
            </div>
          ) : hasSub && profile ? (
            <>
              <div className="flex items-end justify-between gap-3 mt-2">
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">{profile.plan_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{formatDuration(profile.duration_days)} plan</p>
                </div>
                <p className="text-2xl font-extrabold">₹{profile.plan_price}</p>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={lowDays ? 'text-red-400 font-semibold' : 'text-white/70'}>
                    {daysLeft === 0 ? 'Expires today' : daysLeft !== null ? `${daysLeft} days left` : ''}
                  </span>
                  <span className="text-white/45">Expires {formatExpiry(profile.end_date)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${pct}%`, background: lowDays ? '#ef4444' : 'linear-gradient(90deg,#d81f3f,#ff3b5c)' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-bold">No active plan</p>
              <p className="text-xs text-white/50 mt-0.5">Subscribe to unlock all movies & web series.</p>
            </div>
          )}

          <button onClick={handleRenew} disabled={paying} className="btn-primary w-full rounded-2xl py-3.5 text-sm mt-5">
            {paying ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Opening plans…
              </>
            ) : hasSub ? (
              'Renew or upgrade plan'
            ) : (
              'Subscribe now'
            )}
          </button>
        </section>

        {/* Help & legal */}
        <nav className={`${anim} glass rounded-3xl overflow-hidden`} style={{ animationDelay: '120ms' }} aria-label="Help and legal">
          <ul className="divide-y divide-white/[0.06]">
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="focus-ring flex items-center gap-3 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <span className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">Help & support</span>
                  <span className="block text-xs text-white/45 truncate">{SUPPORT_EMAIL}</span>
                </span>
                <Chevron />
              </a>
            </li>
            {LEGAL_LINKS.filter((l) => l.href !== '/contact').map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="focus-ring flex items-center gap-3 px-5 py-3.5 text-sm text-white/80 hover:bg-white/[0.04] transition-colors">
                  <span className="flex-1">{l.label}</span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className={anim} style={{ animationDelay: '180ms' }}>
          {!showLogout ? (
            <button onClick={() => setShowLogout(true)} className="btn-ghost w-full rounded-2xl py-3.5 text-sm text-red-300">
              Log out
            </button>
          ) : (
            <div className="rounded-2xl p-4 text-center bg-red-500/10 border border-red-500/25">
              <p className="text-sm text-white/75 mb-3">Log out of this device?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogout(false)} className="btn-ghost flex-1 rounded-xl py-2.5 text-sm">
                  Cancel
                </button>
                <button onClick={handleLogout} className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-red-500/80 hover:bg-red-500 transition-colors">
                  Yes, log out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-white/30" aria-hidden="true">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  );
}
