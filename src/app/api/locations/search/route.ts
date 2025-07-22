import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await locationService.searchLocations(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in location search API:', error);
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}