/**
 * Email OTP delivery via the Resend HTTP API (plain fetch, no extra dependency).
 * Any provider with a similar JSON endpoint can be swapped in here.
 */
const RESEND_URL = 'https://api.resend.com/emails';

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[dev] OTP for ${email}: ${otp}`);
      return true;
    }
    console.error('sendOtpEmail: missing RESEND_API_KEY / EMAIL_FROM env vars');
    return false;
  }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0f19;padding:32px;color:#fff">
      <div style="max-width:420px;margin:0 auto;background:#12182a;border-radius:16px;padding:28px;border:1px solid rgba(255,255,255,.08)">
        <p style="margin:0 0 4px;font-size:20px;font-weight:700">JALWA <span style="color:#ff3b5c">PLAY</span></p>
        <p style="margin:0 0 20px;color:rgba(255,255,255,.6);font-size:14px">Your one-time login code</p>
        <p style="margin:0 0 20px;font-size:32px;letter-spacing:8px;font-weight:800">${otp}</p>
        <p style="margin:0;color:rgba(255,255,255,.45);font-size:12px">This code is valid for 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    </div>`;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${otp} is your Jalwaplay login code`,
        html,
        text: `${otp} is your Jalwaplay login code. Valid for 10 minutes.`,
      }),
    });
    if (!res.ok) {
      console.error('sendOtpEmail: provider error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendOtpEmail: request failed', err);
    return false;
  }
}
