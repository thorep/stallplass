import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fylkeId = searchParams.get('fylke_id');

    const kommuner = await locationService.getKommuner(fylkeId || undefined);
    return NextResponse.json(kommuner);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch kommuner' },
      { status: 500 }
    );
  }
}