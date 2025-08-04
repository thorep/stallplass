import { NextResponse } from 'next/server';
import { getSponsoredPlacementPrice } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const dailyPrice = await getSponsoredPlacementPrice();
    return NextResponse.json({ dailyPrice });
  } catch (error) {
    logger.error('Error fetching boost daily price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boost daily price' },
      { status: 500 }
    );
  }
}