import { NextResponse } from 'next/server';
import { getAllBoostDiscounts } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const boostDiscounts = await getAllBoostDiscounts();
    return NextResponse.json(boostDiscounts);
  } catch (error) {
    logger.error('Error fetching boost discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boost discounts' },
      { status: 500 }
    );
  }
}