// Browser-only helpers shared by the auth, subscription and profile screens.

export function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1] ?? '';
}

function ls(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

/** Campaign + Meta click attribution captured by CampaignTracker. */
export function getAttribution() {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
    campaignSlug: ls('mr_campaign'),
    metaCampaignId: ls('mr_meta_campaign_id'),
    metaCampaignName: ls('mr_meta_campaign_name'),
  };
}

/** `?c=<campaign>` suffix so attribution survives redirects. */
export function campaignQuery(): string {
  const c = ls('mr_campaign');
  return c ? `?c=${encodeURIComponent(c)}` : '';
}

// Left over from the removed OTP login; still cleared on logout.
const OTP_SENT_KEY = 'jp_otp_sent_at';

/** Clears client-side session leftovers (cookies are cleared by the API). */
export async function logout(redirectTo = '/auth') {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  try {
    for (const k of ['mr_mobile', 'mr_email', 'mr_pending_plan', 'mr_user_id']) localStorage.removeItem(k);
    sessionStorage.removeItem('mr_profile');
    sessionStorage.removeItem(OTP_SENT_KEY);
  } catch {}
  window.location.replace(redirectTo);
}

export function clearProfileCache() {
  try {
    sessionStorage.removeItem('mr_profile');
  } catch {}
}
