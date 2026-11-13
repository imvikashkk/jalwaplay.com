import { NextRequest, NextResponse } from 'next/server';

// Legacy route kept for compatibility — GoCart PayIn uses /api/payment/callback
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/subscription', req.url), 303);
}

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/subscription', req.url), 303);
}
