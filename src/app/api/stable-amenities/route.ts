import { NextResponse } from 'next/server';
import { getAllStableAmenities } from '@/services/amenity-service';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  try {
    const amenities = await getAllStableAmenities();
    return NextResponse.json(amenities);
  } catch (error) {
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'stable_amenities_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch stable amenities' },
      { status: 500 }
    );
  }
}
