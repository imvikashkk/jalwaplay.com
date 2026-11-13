import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { BrandLogo } from '@/components/SiteChrome';
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminToken } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin login | Jalwaplay', robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (verifyAdminToken(jar.get(ADMIN_COOKIE)?.value)) redirect('/admin');
  const configured = isAdminConfigured();

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center px-4 bg-[var(--bg)] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(216,31,63,.18), transparent 70%)' }}
      />
      <div className="relative w-full max-w-sm anim-fade-up">
        <div className="flex flex-col items-center gap-3 mb-6">
          <BrandLogo href="/admin/login" />
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/60">
            Admin panel
          </span>
        </div>
        <div className="glass rounded-3xl p-6">
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="text-sm text-white/50 mt-1 mb-5">Payments, subscriptions and revenue.</p>
          {configured ? (
            <AdminLoginForm />
          ) : (
            <p className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-3 text-xs text-amber-300 leading-relaxed">
              Admin is not set up yet. Add <code className="font-mono">ADMIN_PASSWORD</code> (and optionally{' '}
              <code className="font-mono">ADMIN_USERNAME</code>) to <code className="font-mono">.env.local</code>, then restart the server.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
