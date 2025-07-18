import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const amenities = await prisma.boxAmenity.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching box amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}