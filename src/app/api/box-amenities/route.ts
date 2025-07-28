import { NextResponse } from 'next/server';
import { getAllBoxAmenities } from '@/services/amenity-service';

export async function GET() {
  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}