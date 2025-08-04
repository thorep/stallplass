import { NextResponse } from 'next/server';
import { getAllBoxQuantityDiscounts } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * GET /api/pricing/box-quantity-discounts-public
 * Public endpoint to get box quantity discounts (for display purposes)
 * Used by the bulk advertising page which is public functionality
 */
export async function GET() {
  try {
    const discounts = await getAllBoxQuantityDiscounts();
    
    // Return just the discount information needed for UI
    return NextResponse.json(
      discounts.map(d => ({
        minBoxes: d.minBoxes,
        maxBoxes: d.maxBoxes,
        discountPercentage: d.discountPercentage
      }))
    );
  } catch (error) {
    logger.error('Public box quantity discounts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box quantity discounts' }, 
      { status: 500 }
    );
  }
}