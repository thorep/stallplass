import { NextRequest, NextResponse } from 'next/server';
import { createBox } from '@/services/box-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeStable = searchParams.get('includeStable') === 'true';

    const boxes = await prisma.box.findMany({
      where: {
        isAvailable: true,
        isActive: true,
      },
      include: includeStable ? {
        stable: {
          select: {
            id: true,
            name: true,
            location: true,
            ownerName: true,
            rating: true,
            reviewCount: true,
            images: true,
          }
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      } : {
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      orderBy: [
        { isSponsored: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boxes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating box with data:', data);
    
    // Validate required fields
    if (!data.name || !data.price || !data.stableId) {
      return NextResponse.json(
        { error: 'Name, price, and stableId are required' },
        { status: 400 }
      );
    }

    // Check if stable exists
    const { prisma } = await import('@/lib/prisma');
    
    const stable = await prisma.stable.findUnique({
      where: { id: data.stableId }
    });
    
    if (!stable) {
      console.error('Stable not found:', data.stableId);
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    const box = await createBox(data);
    
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    console.error('Error creating box:', error);
    return NextResponse.json(
      { error: 'Failed to create box' },
      { status: 500 }
    );
  }
}