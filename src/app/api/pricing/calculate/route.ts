import { NextRequest, NextResponse } from 'next/server';
import { 
  getBoxAdvertisingPrice, 
  getAllDiscounts, 
  getBoxQuantityDiscountPercentage 
} from '@/services/pricing-service';

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

    // Get base pricing data
    const baseMonthlyPrice = await getBoxAdvertisingPrice();
    const monthlyDiscounts = await getAllDiscounts();

    // Calculate base totals
    const totalMonthlyPrice = baseMonthlyPrice * boxCount;
    const totalPrice = totalMonthlyPrice * months;

    // Calculate month-based discount
    const monthDiscount = monthlyDiscounts.find(d => d.months === months);
    const monthDiscountPercentage = monthDiscount?.percentage || 0;
    const monthSavings = totalPrice * (monthDiscountPercentage / 100);

    // Calculate box quantity discount
    const boxQuantityDiscountPercentage = await getBoxQuantityDiscountPercentage(boxCount);
    const boxQuantityDiscount = totalPrice * (boxQuantityDiscountPercentage / 100);

    // Calculate final price
    const finalPrice = totalPrice - monthSavings - boxQuantityDiscount;

    return NextResponse.json({
      baseMonthlyPrice,
      totalMonthlyPrice,
      monthDiscount: monthSavings,
      monthDiscountPercentage,
      boxQuantityDiscount,
      boxQuantityDiscountPercentage,
      totalPrice,
      finalPrice
    });
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' }, 
      { status: 500 }
    );
  }
}