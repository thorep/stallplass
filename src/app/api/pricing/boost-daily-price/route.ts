import { NextResponse } from 'next/server';
import { getBoostDailyPrice } from '@/services/pricing-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  try {
    const dailyPrice = await getBoostDailyPrice();
    return NextResponse.json({ dailyPrice });
  } catch (error) {
    logger.error('Error fetching boost daily price:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'pricing_boost_daily_price' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch boost daily price' },
      { status: 500 }
    );
  }
}
