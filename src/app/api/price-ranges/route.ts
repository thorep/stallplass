import { NextResponse } from 'next/server';
import { getPriceRanges } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * GET /api/price-ranges
 * Returns the current min/max price ranges for both boxes and stables
 */
export async function GET() {
  const apiLogger = createApiLogger({
    endpoint: '/api/price-ranges',
    method: 'GET',
    requestId: crypto.randomUUID()
  });

  try {
    apiLogger.info('Price ranges API called');
    const priceRanges = await getPriceRanges();
    apiLogger.debug({ priceRanges }, 'Price ranges retrieved successfully');
    return NextResponse.json(priceRanges);
  } catch (error) {
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to get price ranges');
    
    const fallbackRanges = {
      boxes: { min: 0, max: 10000 },
      stables: { min: 0, max: 15000 }
    };
    
    apiLogger.warn({ fallbackRanges }, 'Returning fallback price ranges');
    return NextResponse.json(fallbackRanges);
  }
}