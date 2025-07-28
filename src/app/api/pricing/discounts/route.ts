import { NextResponse } from 'next/server';
import { getAllDiscounts } from '@/services/pricing-service';

/**
 * GET /api/pricing/discounts
 * Public endpoint to get pricing discounts
 * Used by the pricing calculator which is public
 */
export async function GET() {
  try {
    const discounts = await getAllDiscounts();
    return NextResponse.json(discounts);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch pricing discounts' }, 
      { status: 500 }
    );
  }
}