import { NextResponse } from 'next/server';
import { getAllBoxAmenities } from '@/services/amenity-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}