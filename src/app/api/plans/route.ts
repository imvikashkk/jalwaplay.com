import { NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/apiError';
import pool from '@/lib/db';
import { DEFAULT_PLANS } from '@/lib/plans';

export async function GET() {
  try {
    // No database configured at all: plans defined in the app.
    if (!process.env.DB_NAME) {
      return NextResponse.json({ success: true, data: DEFAULT_PLANS });
    }

    const res = await pool.query(
      `SELECT id, name, price, original_price, duration_days, description
       FROM plans WHERE is_active = true ORDER BY price ASC`,
    );
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err) {
    return serverErrorResponse('plans', err);
  }
}
