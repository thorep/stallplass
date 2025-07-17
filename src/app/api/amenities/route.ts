import { NextResponse } from 'next/server';
import { getAllAmenities } from '@/services/amenity-service';

export async function GET() {
  try {
    const amenities = await getAllAmenities();
    
    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}