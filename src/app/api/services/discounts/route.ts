import { NextResponse } from 'next/server';
import { getServiceDiscounts } from '@/services/marketplace-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const discounts = await getServiceDiscounts();
    return NextResponse.json(discounts);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service discounts' },
      { status: 500 }
    );
  }
}