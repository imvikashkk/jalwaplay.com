const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

export async function sendOtpSms(mobile: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const senderId = process.env.FAST2SMS_SENDER_ID;
  const templateId = process.env.FAST2SMS_TEMPLATE_ID;

  if (!apiKey || !senderId || !templateId) {
    // Local development without SMS credentials: print the OTP to the server log.
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[dev] OTP for ${mobile}: ${otp}`);
      return true;
    }
    console.error('sendOtpSms: missing FAST2SMS_* env vars');
    return false;
  }

  const params = new URLSearchParams({
    authorization: apiKey,
    route: 'dlt',
    sender_id: senderId,
    message: templateId,
    variables_values: `${otp}|Jalwaplay|10`,
    flash: '0',
    numbers: mobile,
  });

  try {
    const res = await fetch(`${FAST2SMS_URL}?${params.toString()}`, {
      method: 'GET',
    });
    const data = await res.json();
    if (!data.return) {
      console.error('sendOtpSms: Fast2SMS error', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendOtpSms: request failed', err);
    return false;
  }
}
