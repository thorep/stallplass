import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/stable-amenities or /api/box-amenities instead.' },
    { status: 410 }
  );
}