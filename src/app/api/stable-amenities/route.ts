import { NextResponse } from 'next/server';
import { getAllStableAmenities } from '@/services/amenity-service';
// Removed unused PostHog import
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  try {
    const amenities = await getAllStableAmenities();
    return NextResponse.json(amenities);
  } catch (error) {
    try { captureApiError({ error, context: 'stable_amenities_get', route: '/api/stable-amenities', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch stable amenities' },
      { status: 500 }
    );
  }
}
