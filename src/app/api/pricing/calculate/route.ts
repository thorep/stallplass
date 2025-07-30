import { NextRequest, NextResponse } from 'next/server';
import { calculatePricingWithDiscounts } from '@/services/pricing-service';

/**
 * GET /api/pricing/calculate?boxes=1&months=1
 * Public endpoint to calculate pricing with discounts
 * Used by the advertising modal which is public functionality
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boxCount = parseInt(searchParams.get('boxes') || '1');
    const months = parseInt(searchParams.get('months') || '1');

    if (boxCount < 1 || months < 1) {
      return NextResponse.json(
        { error: 'Box count and months must be positive integers' },
        { status: 400 }
      );
    }

    // Use the same calculation function as invoice validation to ensure consistency
    const pricing = await calculatePricingWithDiscounts(boxCount, months);

    return NextResponse.json({
      baseMonthlyPrice: pricing.baseMonthlyPrice,
      totalMonthlyPrice: pricing.totalMonthlyPrice,
      monthDiscount: pricing.monthDiscount,
      monthDiscountPercentage: pricing.monthDiscountPercentage,
      boxQuantityDiscount: pricing.boxQuantityDiscount,
      boxQuantityDiscountPercentage: pricing.boxQuantityDiscountPercentage,
      totalPrice: pricing.totalPrice,
      finalPrice: pricing.finalPrice
    });
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' }, 
      { status: 500 }
    );
  }
}