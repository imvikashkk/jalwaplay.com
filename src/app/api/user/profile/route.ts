import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import pool from '@/lib/db';
import { verifyUserToken } from '@/lib/userAuth';
import { isGuestUserId, readGuestIdentity } from '@/lib/guest';

export async function GET(req: NextRequest) {
  try {
    const userId = verifyUserToken(req.cookies.get('mr_token')?.value);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (isGuestUserId(userId)) {
      return NextResponse.json({
        success: true,
        data: { id: userId, ...readGuestIdentity(req), sub_status: null, end_date: null, plan_name: null, plan_price: null, duration_days: null, days_left: null },
      });
    }

    const res = await pool.query(
      `SELECT u.id, u.mobile, u.email, u.created_at,
              s.status AS sub_status, s.end_date,
              p.name AS plan_name, p.price AS plan_price, p.duration_days,
              GREATEST(0, CEIL(EXTRACT(EPOCH FROM (s.end_date - NOW())) / 86400))::int AS days_left
       FROM users u
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions
         WHERE user_id = u.id AND status = 'active' AND end_date > NOW()
         ORDER BY end_date DESC LIMIT 1
       ) s ON true
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE u.id = $1`,
      [userId],
    );

    if (res.rows.length === 0) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err) {
    return serverErrorResponse('profile', err);
  }
}
