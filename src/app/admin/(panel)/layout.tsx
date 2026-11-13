import type { ReactNode } from 'react';
import { AdminLogout, AdminNav } from '@/components/admin/AdminNav';
import { BrandLogo } from '@/components/SiteChrome';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin | Jalwaplay', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-white md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 h-[100dvh] sticky top-0 border-r border-white/[0.06] p-4">
        <div className="flex items-center gap-2 px-2 py-2">
          <BrandLogo href="/admin" />
        </div>
        <span className="mx-2 mt-1 mb-6 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--accent)]/15 text-[#ff8da0]">
          Admin
        </span>
        <AdminNav variant="side" />
        <div className="mt-auto">
          <AdminLogout />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg)]/85 backdrop-blur-xl">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo href="/admin" />
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--accent)]/15 text-[#ff8da0]">
              Admin
            </span>
          </div>
          <AdminLogout compact />
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-5 md:pt-8 pb-28 md:pb-12">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      <AdminNav variant="bottom" />
    </div>
  );
}
