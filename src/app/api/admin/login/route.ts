import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECS,
  checkAdminCredentials,
  createAdminToken,
  isAdminConfigured,
} from '@/lib/adminAuth';

// Naive in-memory throttle: max 5 failed attempts per IP per 10 minutes.
const failures = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ success: false, message: 'Admin panel is not configured (ADMIN_PASSWORD missing).' }, { status: 503 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const f = failures.get(ip);
  if (f && f.until > now && f.n >= 5) {
    return NextResponse.json({ success: false, message: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!checkAdminCredentials(username, password)) {
    const cur = f && f.until > now ? f : { n: 0, until: now + WINDOW_MS };
    failures.set(ip, { n: cur.n + 1, until: cur.until });
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ success: false, message: 'Wrong username or password.' }, { status: 401 });
  }

  failures.delete(ip);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_SECS,
  });
  return res;
}
