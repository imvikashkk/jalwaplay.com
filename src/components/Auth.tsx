'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell, { ACCENT, ERROR, FormAlert, Spinner, SUCCESS } from './AuthShell';
import { campaignQuery, getAttribution } from '@/lib/clientSession';
import { isValidMobile } from '@/lib/validation';

/** Digits only; strips a pasted +91 / 0 prefix, caps at 10 digits. */
function cleanMobileInput(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  else if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

function IndiaFlag() {
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" className="rounded-full overflow-hidden flex-shrink-0" aria-hidden="true">
      <rect x="0" y="0" width="22" height="7.33" fill="#FF9933" />
      <rect x="0" y="7.33" width="22" height="7.33" fill="#fff" />
      <rect x="0" y="14.66" width="22" height="7.34" fill="#138808" />
      <circle cx="11" cy="11" r="2.6" fill="none" stroke="#000088" strokeWidth="0.8" />
    </svg>
  );
}

/**
 * Login screen — direct mobile-number login (no OTP).
 * New / unsubscribed users go straight to the payment page; subscribers to Home.
 */
export default function AuthPage() {
  const params = useSearchParams();

  const [mobile, setMobile] = useState(() => cleanMobileInput(params.get('mobile') ?? ''));
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = isValidMobile(mobile);

  const fieldError =
    touched && mobile.length === 10 && !isValid ? 'Mobile number must start with 6, 7, 8 or 9.' : '';

  const hint = (() => {
    if (fieldError) return { text: fieldError, color: ERROR, icon: '⚠' };
    const len = mobile.length;
    if (len === 0) return { text: 'Enter your 10-digit mobile number', color: 'rgba(255,255,255,0.45)', icon: 'ℹ' };
    if (len < 10)
      return { text: `${10 - len} digit${10 - len === 1 ? '' : 's'} remaining`, color: '#ff8080', icon: 'ℹ' };
    return { text: 'Looks good! Tap to continue', color: SUCCESS, icon: '✓' };
  })();

  const borderColor = fieldError ? ERROR : focused ? ACCENT : isValid ? SUCCESS : 'rgba(255,255,255,0.3)';
  const ringColor = fieldError
    ? 'rgba(231,76,60,0.2)'
    : focused
      ? 'rgba(255, 59, 92, 0.2)'
      : isValid
        ? 'rgba(29, 158, 117, 0.2)'
        : 'transparent';

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!isValid || submitting) {
      if (!isValid) inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, ...getAttribution() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        setServerError(data.message ?? 'Login failed. Please try again.');
        setSubmitting(false);
        return;
      }
      try {
        if (data.data.mobile) localStorage.setItem('mr_mobile', data.data.mobile);
        sessionStorage.removeItem('mr_profile');
      } catch {}
      // Active subscription → Home, otherwise → payment page.
      // replace() so Back doesn't return to the login screen.
      window.location.replace(data.data.hasActiveSub ? '/' : `/subscription${campaignQuery()}`);
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} noValidate className="auth-card rounded-2xl p-5 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70 bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} aria-hidden="true" />
            18+ only
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Login or sign up with your mobile number
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-input" className="text-xs font-medium text-white/60 uppercase tracking-widest block">
            Mobile Number
          </label>

          <div
            className="auth-field animate-fadeIn flex items-stretch rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: `1.5px solid ${borderColor}`,
              boxShadow: `0 0 0 3px ${ringColor}`,
            }}
          >
            <div className="flex items-center gap-2 px-3.5 bg-gray-100 border-r border-gray-200 text-sm font-semibold text-gray-700 flex-shrink-0">
              <IndiaFlag />
              +91
            </div>

            <input
              ref={inputRef}
              id="login-input"
              name="tel"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={16}
              placeholder="Enter 10-digit number"
              value={mobile}
              aria-invalid={!!fieldError}
              aria-describedby="login-hint"
              onChange={(e) => {
                setServerError('');
                setMobile(cleanMobileInput(e.target.value));
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                if (mobile) setTouched(true);
              }}
              className="flex-1 bg-transparent px-3.5 py-3.5 text-base font-medium text-gray-800 placeholder-gray-400 outline-none min-w-0 tracking-wide"
            />

            {mobile.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMobile('');
                  setTouched(false);
                  inputRef.current?.focus();
                }}
                className="w-10 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                tabIndex={-1}
                aria-label="Clear"
              >
                ✕
              </button>
            )}
          </div>

          <div className="h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(mobile.length / 10) * 100}%`,
                background: fieldError ? ERROR : isValid ? SUCCESS : ACCENT,
              }}
            />
          </div>

          <p
            id="login-hint"
            className="text-xs flex items-center gap-1.5 transition-colors duration-200 min-h-[1rem]"
            style={{ color: hint.color }}
          >
            <span aria-hidden="true">{hint.icon}</span> {hint.text}
          </p>
        </div>

        <FormAlert message={serverError} />

        <button
          type="submit"
          disabled={!isValid || submitting}
          aria-busy={submitting}
          className="auth-btn w-full py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base tracking-wide uppercase text-white"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Please wait...
            </span>
          ) : (
            'Continue'
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Secure login
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
          <span>Cancel anytime</span>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-white/40 border-t border-white/5 pt-5">
          By continuing, you agree to our{' '}
          <Link href="/terms-and-conditions" className="auth-link text-white/70 hover:text-white underline underline-offset-2">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="auth-link text-white/70 hover:text-white underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
