import { NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';

export async function GET() {
  try {
    const fylker = await locationService.getFylker();
    return NextResponse.json(fylker);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fylker' },
      { status: 500 }
    );
  }
}