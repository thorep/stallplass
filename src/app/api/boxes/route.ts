import { NextRequest, NextResponse } from 'next/server';
import { createBox, searchBoxes, BoxFilters } from '@/services/box-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search/filter parameters
    const filters: BoxFilters = {};
    
    if (searchParams.get('stableId')) {
      filters.stableId = searchParams.get('stableId')!;
    }
    
    if (searchParams.get('isAvailable')) {
      filters.isAvailable = searchParams.get('isAvailable') === 'true';
    }
    
    if (searchParams.get('occupancyStatus')) {
      const status = searchParams.get('occupancyStatus')!;
      if (['all', 'available', 'occupied'].includes(status)) {
        filters.occupancyStatus = status as 'all' | 'available' | 'occupied';
      }
    }
    
    if (searchParams.get('minPrice')) {
      filters.minPrice = parseInt(searchParams.get('minPrice')!);
    }
    
    if (searchParams.get('maxPrice')) {
      filters.maxPrice = parseInt(searchParams.get('maxPrice')!);
    }
    
    if (searchParams.get('isIndoor')) {
      filters.isIndoor = searchParams.get('isIndoor') === 'true';
    }
    
    if (searchParams.get('hasWindow')) {
      filters.hasWindow = searchParams.get('hasWindow') === 'true';
    }
    
    if (searchParams.get('hasElectricity')) {
      filters.hasElectricity = searchParams.get('hasElectricity') === 'true';
    }
    
    if (searchParams.get('hasWater')) {
      filters.hasWater = searchParams.get('hasWater') === 'true';
    }
    
    if (searchParams.get('maxHorseSize')) {
      filters.maxHorseSize = searchParams.get('maxHorseSize')!;
    }
    
    if (searchParams.get('amenityIds')) {
      filters.amenityIds = searchParams.get('amenityIds')!.split(',');
    }

    // Use the search service which includes occupancy filtering
    const boxes = await searchBoxes(filters);

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