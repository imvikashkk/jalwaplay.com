import type { NextRequest } from 'next/server';

/**
 * Public origin of the site. Behind a reverse proxy `req.url` in route handlers
 * points at the internal server (e.g. localhost:3019), so redirects must not be
 * built from it. Prefer NEXT_PUBLIC_APP_URL, then forwarded headers.
 */
export function publicOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/+$/, '');

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
    return `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
  }
  return req.nextUrl.origin;
}

/** Absolute URL on the public origin. */
export function publicUrl(req: NextRequest, path: string): URL {
  return new URL(path, publicOrigin(req));
}
