import { NextResponse } from 'next/server';
import { getAllBoxAmenities } from '@/services/amenity-service';
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch (error) {
    try { captureApiError({ error, context: 'box_amenities_get', route: '/api/box-amenities', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}
