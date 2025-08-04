import { NextResponse } from 'next/server';
import { getBoxAdvertisingPriceObject } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const boxAdvertisingPrice = await getBoxAdvertisingPriceObject();
    return NextResponse.json(boxAdvertisingPrice);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch box advertising price' }, 
      { status: 500 }
    );
  }
}