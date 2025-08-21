import { NextResponse } from 'next/server';
import { getAllBoxAmenities } from '@/services/amenity-service';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch (error) {
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'box_amenities_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}
