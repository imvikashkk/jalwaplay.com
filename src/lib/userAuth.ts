import { createHmac, timingSafeEqual } from 'crypto';

const DEV_SECRET = 'user-dev-secret-change-in-prod';

function getSecret(): string {
  const secret = process.env.USER_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Never sign production sessions with a publicly known secret.
    throw new Error('USER_TOKEN_SECRET is not set');
  }
  return DEV_SECRET;
}

/** HMAC-sign arbitrary data with the session secret. */
export function signValue(data: string): string {
  return sign(data);
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('hex').slice(0, 32);
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Token format (unchanged from the original): `${userId}.${exp}.${sig}` */
export function generateUserToken(userId: number, secsValid: number): string {
  const exp = Math.floor(Date.now() / 1000) + secsValid;
  const data = `${userId}.${exp}`;
  return `${data}.${sign(data)}`;
}

export function verifyUserToken(token: string | undefined): number | null {
  if (!token) return null;
  const dot1 = token.indexOf('.');
  const dot2 = token.indexOf('.', dot1 + 1);
  if (dot1 < 0 || dot2 < 0) return null;
  const data = token.slice(0, dot2);
  const sig = token.slice(dot2 + 1);
  try {
    if (!safeEqual(sign(data), sig)) return null;
  } catch {
    return null;
  }
  const exp = parseInt(token.slice(dot1 + 1, dot2), 10);
  if (isNaN(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const userId = parseInt(token.slice(0, dot1), 10);
  if (isNaN(userId)) return null;
  return userId;
}

/**
 * Subscription flag bound to a specific session token, so `mr_has_sub`
 * can't be forged by hand-editing cookies.
 */
export function signSubFlag(token: string): string {
  return sign(`sub:${token}`);
}

export function isValidSubFlag(token: string | undefined, flag: string | undefined): boolean {
  if (!token || !flag || flag === '0') return false;
  try {
    return safeEqual(signSubFlag(token), flag);
  } catch {
    return false;
  }
}
