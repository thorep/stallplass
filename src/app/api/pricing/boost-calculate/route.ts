import { NextRequest, NextResponse } from 'next/server';
import { getBoostDailyPrice, getAllBoostDiscounts } from '@/services/pricing-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    
    if (!daysParam) {
      return NextResponse.json(
        { error: 'Days parameter is required' },
        { status: 400 }
      );
    }
    
    const days = parseInt(daysParam, 10);
    
    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: 'Days must be a positive number' },
        { status: 400 }
      );
    }
    
    const dailyPrice = await getBoostDailyPrice();
    const baseTotal = dailyPrice * days;
    
    // Get applicable discount
    const boostDiscounts = await getAllBoostDiscounts();
    const applicableDiscount = boostDiscounts
      .filter((d) => {
        if (!d.isActive) return false;
        // Check if days falls within the range
        const meetsMin = days >= d.days;
        const meetsMax = d.maxDays === null || days <= d.maxDays;
        return meetsMin && meetsMax;
      })
      .sort((a, b) => b.percentage - a.percentage)[0];
    
    const discountPercentage = applicableDiscount?.percentage || 0;
    const discount = baseTotal * (discountPercentage / 100);
    const totalCost = baseTotal - discount;
    
    return NextResponse.json({
      dailyPrice,
      baseTotal,
      discount,
      discountPercentage,
      totalCost,
      days
    });
  } catch (error) {
    logger.error('Error calculating boost pricing:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'pricing_boost_calculate' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to calculate boost pricing' },
      { status: 500 }
    );
  }
}
