import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeEqual, signValue } from './userAuth';

/**
 * Admin panel auth — a single admin account configured in env:
 *   ADMIN_USERNAME (default "admin")
 *   ADMIN_PASSWORD (required; the panel stays locked while it is unset)
 * Session = signed, httpOnly cookie `jp_admin` = `admin.<exp>.<sig>`.
 */

export const ADMIN_COOKIE = 'jp_admin';
export const ADMIN_SESSION_SECS = 60 * 60 * 12; // 12 hours

export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedPass) return false;
  // Compare signatures (fixed length) so timing doesn't leak lengths.
  const userOk = safeEqual(signValue(`u:${username}`), signValue(`u:${expectedUser}`));
  const passOk = safeEqual(signValue(`p:${password}`), signValue(`p:${expectedPass}`));
  return userOk && passOk;
}

export function createAdminToken(): string {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECS;
  const data = `admin.${exp}`;
  return `${data}.${signValue(data)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !isAdminConfigured()) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'admin') return false;
  const data = `${parts[0]}.${parts[1]}`;
  try {
    if (!safeEqual(signValue(data), parts[2])) return false;
  } catch {
    return false;
  }
  const exp = parseInt(parts[1], 10);
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}

/** Server components: bounce to the admin login unless signed in. */
export async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!verifyAdminToken(jar.get(ADMIN_COOKIE)?.value)) redirect('/admin/login');
}
