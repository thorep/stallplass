import { NextRequest, NextResponse } from 'next/server';
import { calculateServicePricing, getServiceDiscountTiers } from '@/services/service-pricing-service';
import { getServiceBasePriceObject } from '@/services/pricing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months');

    if (monthsParam) {
      // Calculate pricing for specific number of months
      const months = parseInt(monthsParam, 10);
      if (isNaN(months) || months < 1) {
        return NextResponse.json(
          { error: 'Months must be a positive number' },
          { status: 400 }
        );
      }

      const calculation = await calculateServicePricing(months);
      return NextResponse.json({ calculation });
    } else {
      // Return base price and discount tiers for the pricing page
      const [basePrice, tiers] = await Promise.all([
        getServiceBasePriceObject(),
        getServiceDiscountTiers()
      ]);
      
      return NextResponse.json({ 
        basePrice: basePrice?.price,
        tiers,
        discounts: tiers.map(tier => ({
          months: tier.months,
          percentage: tier.percentage
        }))
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service pricing' },
      { status: 500 }
    );
  }
}