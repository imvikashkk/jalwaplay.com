'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { clearProfileCache } from '@/lib/clientSession';
import { BrandLogo, SUPPORT_EMAIL } from './SiteChrome';

export default function PaymentStatusPage() {
  const params = useSearchParams();
  const status = params.get('status');
  const txnId = params.get('txnid') ?? params.get('txnId') ?? '';
  // 'pending' = SabPaisa hasn't confirmed yet; keep checking for a short while.
  const isSuccess = (status === 'success' || status === 'pending') && !!txnId;

  const [state, setState] = useState<'loading' | 'success' | 'failed'>(
    'loading',
  );
  const [msg, setMsg] = useState('Payment confirm ho raha hai...');

  useEffect(() => {
    if (!isSuccess) {
      setTimeout(() => {
        setState('failed');
        setMsg('Payment failed ya cancel ho gaya.');
      }, 0);
      setTimeout(() => {
        window.location.replace('/subscription');
      }, 2500);
      return;
    }

    const MAX_TRIES = 6;
    const verify = async (attempt = 1): Promise<void> => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txnId }),
        });
        if (res.status === 401) {
          window.location.replace('/auth');
          return;
        }
        const data = await res.json();

        if (!data.success && data.message === 'Payment not completed yet' && attempt < MAX_TRIES) {
          setTimeout(() => verify(attempt + 1), 3000);
          return;
        }

        if (data.success) {
          localStorage.removeItem('mr_campaign');
          localStorage.removeItem('mr_meta_campaign_id');
          localStorage.removeItem('mr_meta_campaign_name');
          clearProfileCache();
          setState('success');
          setMsg('Payment successful! Subscription active ho gayi 🎉');
          setTimeout(() => {
            window.location.replace('/');
          }, 1800);
        } else {
          setState('failed');
          setMsg(
            data.message === 'Payment failed'
              ? 'Payment failed ya cancel ho gaya.'
              : 'Payment verify nahi ho saka. Support se contact karo.',
          );
          setTimeout(() => {
            window.location.replace('/subscription');
          }, 3000);
        }
      } catch {
        setState('failed');
        setMsg('Network error. Please try again.');
        setTimeout(() => {
          window.location.replace('/subscription');
        }, 3000);
      }
    };

    verify();
  }, [isSuccess, txnId]);

  const tone =
    state === 'success'
      ? { c: '#22c55e', ring: 'rgba(34,197,94,.35)' }
      : state === 'failed'
        ? { c: '#ef4444', ring: 'rgba(239,68,68,.35)' }
        : { c: '#ff3b5c', ring: 'rgba(255,59,92,.35)' };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[var(--bg)] text-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        aria-hidden="true"
        style={{ background: `radial-gradient(ellipse 60% 45% at 50% 40%, ${tone.ring.replace('.35', '.18')}, transparent 70%)` }}
      />

      <div className="relative w-full max-w-sm anim-fade-up">
        <div className="flex justify-center mb-6">
          <BrandLogo />
        </div>

        <div className="glass rounded-3xl px-6 py-8 text-center" role="status" aria-live="polite">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {state === 'loading' ? (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-white/10" />
                <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent)] animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl" aria-hidden="true">
                  ₹
                </span>
              </>
            ) : (
              <>
                <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: tone.c }} />
                <span
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: tone.c, boxShadow: `0 16px 40px -10px ${tone.c}` }}
                >
                  {state === 'success' ? (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </span>
              </>
            )}
          </div>

          <h1 className="text-xl font-bold leading-snug">{msg}</h1>
          <p className="mt-2 text-sm text-white/50">
            {state === 'loading'
              ? 'Thoda wait karo… page band mat karna.'
              : state === 'success'
                ? 'Home page pe le ja rahe hain…'
                : 'Plans page pe wapas le ja rahe hain…'}
          </p>

          {state !== 'loading' && (
            <div className="mt-6 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full origin-left"
                style={{ background: tone.c, animation: `statusBar ${state === 'success' ? 1.8 : 2.5}s linear forwards` }}
              />
            </div>
          )}

          {state === 'failed' && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Payment issue ${txnId}`.trim())}`} className="btn-ghost rounded-xl py-3 text-sm">
                Get help
              </a>
              <button onClick={() => window.location.replace('/subscription')} className="btn-primary rounded-xl py-3 text-sm">
                Try again
              </button>
            </div>
          )}
        </div>

        {txnId && (
          <p className="mt-4 text-center text-[11px] text-white/35">
            Transaction ID: <span className="font-mono text-white/55 break-all">{txnId}</span>
          </p>
        )}
      </div>

      <style>{`@keyframes statusBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}
