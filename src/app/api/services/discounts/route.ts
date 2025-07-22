import { NextRequest, NextResponse } from 'next/server';
import { getServiceDiscounts } from '@/services/marketplace-service';

export async function GET(request: NextRequest) {
  try {
    const discounts = await getServiceDiscounts();
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error fetching service discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service discounts' },
      { status: 500 }
    );
  }
}