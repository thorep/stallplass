import { NextResponse } from 'next/server';
import { getAllBoostDiscounts } from '@/services/pricing-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  try {
    const boostDiscounts = await getAllBoostDiscounts();
    return NextResponse.json(boostDiscounts);
  } catch (error) {
    logger.error('Error fetching boost discounts:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'pricing_boost_discounts' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch boost discounts' },
      { status: 500 }
    );
  }
}
