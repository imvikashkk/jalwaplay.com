import { NextResponse } from 'next/server';

/**
 * Turns common setup/config failures (database not reachable, schema not
 * applied, missing secrets) into an actionable message instead of a generic
 * "Something went wrong". Details are returned to the browser only outside
 * production; they are always written to the server log.
 */
export function describeServerError(err: unknown): string | null {
  const e = err as { code?: string; message?: string } | undefined;
  const code = e?.code ?? '';
  const msg = e?.message ?? '';

  if (!process.env.DB_NAME || !process.env.DB_USER) {
    return 'Database is not configured: set DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD in .env.local (see .env.example), then restart the server. (The demo number works without a database.)';
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOENT'].includes(code) || /connect|timeout/i.test(msg) && !code) {
    return `Cannot connect to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}. Make sure PostgreSQL is running and DB_HOST/DB_PORT are correct.`;
  }
  if (code === '28P01' || code === '28000' || /password must be a string|password authentication/i.test(msg)) {
    return 'PostgreSQL login failed: check DB_USER and DB_PASSWORD in .env.local.';
  }
  if (code === '3D000') {
    return `Database "${process.env.DB_NAME}" does not exist. Create it (createdb ${process.env.DB_NAME}) and run: npm run db:setup`;
  }
  if (code === '42P01' || code === '42703' || code === '23502') {
    return 'Database tables are missing or outdated. Run: npm run db:setup (safe to re-run), then try again.';
  }
  if (/USER_TOKEN_SECRET/.test(msg)) {
    return 'USER_TOKEN_SECRET is not set. Add a long random value to your environment (required for production builds).';
  }
  return null;
}

export function serverErrorResponse(context: string, err: unknown) {
  const hint = describeServerError(err);
  console.error(`${context} error:`, err);
  if (hint) console.error(`${context} → ${hint}`);
  const showHint = !!hint && process.env.NODE_ENV !== 'production';
  return NextResponse.json(
    {
      success: false,
      message: showHint ? `Setup error: ${hint}` : 'Something went wrong. Please try again.',
    },
    { status: 500 },
  );
}
