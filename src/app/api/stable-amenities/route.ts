import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const amenities = await prisma.stableAmenity.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching stable amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stable amenities' },
      { status: 500 }
    );
  }
}