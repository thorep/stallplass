import { NextResponse } from 'next/server';
import { getBasePriceObject } from '@/services/pricing-service';

export async function GET() {
  try {
    const basePrice = await getBasePriceObject();
    return NextResponse.json(basePrice);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch base price' }, 
      { status: 500 }
    );
  }
}