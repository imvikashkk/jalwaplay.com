// Shared by client components and API routes — keep free of Node-only imports.

export type LoginChannel = 'mobile' | 'email';

export const OTP_LENGTH = 6;
export const MOBILE_RE = /^[6-9]\d{9}$/;
// Pragmatic email check: local@domain.tld, no spaces, max 254 chars.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeMobile(v: string): string {
  return v.replace(/\D/g, '').slice(-10);
}

export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

export function isValidMobile(v: string): boolean {
  return MOBILE_RE.test(v);
}

export function isValidEmail(v: string): boolean {
  return v.length <= 254 && EMAIL_RE.test(v);
}

export function isValidOtp(v: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(v);
}

export function maskMobile(mobile: string): string {
  return mobile.length >= 10
    ? `+91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`
    : `+91 ${mobile}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(1, Math.min(6, local.length - visible.length)))}@${domain}`;
}
