import { NextRequest, NextResponse } from 'next/server';
import { calculateServicePricing, getServiceDiscountTiers } from '@/services/service-pricing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');

    if (daysParam) {
      // Calculate pricing for specific number of days
      const days = parseInt(daysParam, 10);
      if (isNaN(days) || days < 1) {
        return NextResponse.json(
          { error: 'Days must be a positive number' },
          { status: 400 }
        );
      }

      const calculation = await calculateServicePricing(days);
      return NextResponse.json({ calculation });
    } else {
      // Return discount tiers
      const tiers = await getServiceDiscountTiers();
      return NextResponse.json({ tiers });
    }
  } catch (error) {
    console.error('Error fetching service pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service pricing' },
      { status: 500 }
    );
  }
}