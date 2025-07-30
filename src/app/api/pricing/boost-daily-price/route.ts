import { NextResponse } from 'next/server';
import { getSponsoredPlacementPrice } from '@/services/pricing-service';

export async function GET() {
  try {
    const dailyPrice = await getSponsoredPlacementPrice();
    return NextResponse.json({ dailyPrice });
  } catch (error) {
    console.error('Error fetching boost daily price:', error);
    return NextResponse.json(
      { dailyPrice: 2 }, // fallback to 2 kr
      { status: 200 }
    );
  }
}