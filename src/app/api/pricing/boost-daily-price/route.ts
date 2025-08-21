import { NextResponse } from 'next/server';
import { getBoostDailyPrice } from '@/services/pricing-service';
import { logger } from '@/lib/logger';
import { captureApiError } from '@/lib/posthog-capture';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  try {
    const dailyPrice = await getBoostDailyPrice();
    return NextResponse.json({ dailyPrice });
  } catch (error) {
    logger.error('Error fetching boost daily price:', error);
    try { captureApiError({ error, context: 'pricing_boost_daily_price_get', route: '/api/pricing/boost-daily-price', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch boost daily price' },
      { status: 500 }
    );
  }
}
