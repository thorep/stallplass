import { NextResponse } from 'next/server';
import { getPriceRanges } from '@/services/pricing-service';

/**
 * GET /api/price-ranges
 * Returns the current min/max price ranges for both boxes and stables
 */
export async function GET() {
  try {
    console.log('Price ranges API called');
    const priceRanges = await getPriceRanges();
    console.log('Price ranges result:', priceRanges);
    return NextResponse.json(priceRanges);
  } catch (error) {
    console.error('Failed to get price ranges:', error);
    const fallbackRanges = {
      boxes: { min: 0, max: 10000 },
      stables: { min: 0, max: 15000 }
    };
    return NextResponse.json(fallbackRanges);
  }
}