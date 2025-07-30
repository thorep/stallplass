import { NextResponse } from 'next/server';
import { getAllBoostDiscounts } from '@/services/pricing-service';

export async function GET() {
  try {
    const boostDiscounts = await getAllBoostDiscounts();
    return NextResponse.json(boostDiscounts);
  } catch (error) {
    console.error('Error fetching boost discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boost discounts' },
      { status: 500 }
    );
  }
}