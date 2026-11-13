'use client';

import { useState, type FormEvent } from 'react';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        window.location.replace('/admin');
        return;
      }
      setError(data.message ?? 'Login failed.');
    } catch {
      setError('Network error. Try again.');
    }
    setBusy(false);
  };

  const field =
    'w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-base placeholder:text-white/35 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="admin-user" className="text-xs font-semibold text-white/60">
          Username
        </label>
        <input id="admin-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className={field} placeholder="admin" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="admin-pass" className="text-xs font-semibold text-white/60">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-pass"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${field} pr-16`}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/55 hover:text-white"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-xs text-red-300">
          ⚠ {error}
        </p>
      )}
      <button type="submit" disabled={busy || !username || !password} className="btn-primary w-full rounded-xl py-3.5 text-sm">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
