import { NextResponse } from 'next/server';
import { getAllStableAmenities } from '@/services/amenity-service';

export async function GET() {
  try {
    const amenities = await getAllStableAmenities();
    return NextResponse.json(amenities);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch stable amenities' },
      { status: 500 }
    );
  }
}