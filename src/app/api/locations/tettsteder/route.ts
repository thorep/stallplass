import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kommuneId = searchParams.get('kommune_id');

    const tettsteder = await locationService.getTettsteder(kommuneId || undefined);
    return NextResponse.json(tettsteder);
  } catch (error) {
    console.error('Error in tettsteder API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tettsteder' },
      { status: 500 }
    );
  }
}