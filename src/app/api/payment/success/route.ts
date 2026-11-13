import { NextRequest, NextResponse } from 'next/server';
import { publicUrl } from '@/lib/appUrl';

// Legacy route kept for compatibility — GoCart PayIn uses /api/payment/callback
export async function GET(req: NextRequest) {
  return NextResponse.redirect(publicUrl(req, '/subscription'), 303);
}

export async function POST(req: NextRequest) {
  return NextResponse.redirect(publicUrl(req, '/subscription'), 303);
}
