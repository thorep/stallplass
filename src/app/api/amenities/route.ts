import { NextResponse } from 'next/server';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/stable-amenities or /api/box-amenities instead.' },
    { status: 410 }
  );
}