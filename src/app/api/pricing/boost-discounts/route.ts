import { NextResponse } from 'next/server';
import { getAllBoostDiscounts } from '@/services/pricing-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  try {
    const boostDiscounts = await getAllBoostDiscounts();
    return NextResponse.json(boostDiscounts);
  } catch (error) {
    logger.error('Error fetching boost discounts:', error);
    try { captureApiError({ error, context: 'pricing_boost_discounts_get', route: '/api/pricing/boost-discounts', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch boost discounts' },
      { status: 500 }
    );
  }
}
