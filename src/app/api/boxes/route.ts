import { NextRequest, NextResponse } from 'next/server';
import { createBoxServer, searchBoxes, type BoxFilters } from '@/services/box-service';
import { prisma } from '@/services/prisma';
import { withApiLogging, logBusinessOperation } from '@/lib/api-middleware';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger } from '@/lib/logger';
import { BoxType } from '@/generated/prisma';

async function getBoxes(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse search/filter parameters
  const filters: BoxFilters = {};
  
  if (searchParams.get('stable_id')) {
    filters.stableId = searchParams.get('stable_id')!;
  }
  
  if (searchParams.get('is_available')) {
    filters.isAvailable = searchParams.get('is_available') === 'true';
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
  
  // Note: isIndoor, hasWindow, hasElectricity, hasWater fields removed from schema
  // These should now be handled via box_amenities relation
  
  if (searchParams.get('max_horse_size')) {
    filters.maxHorseSize = searchParams.get('max_horse_size')!;
  }
  
  if (searchParams.get('fylkeId')) {
    filters.fylkeId = searchParams.get('fylkeId')!;
  }
  
  if (searchParams.get('kommuneId')) {
    filters.kommuneId = searchParams.get('kommuneId')!;
  }
  
  if (searchParams.get('amenityIds')) {
    filters.amenityIds = searchParams.get('amenityIds')!.split(',');
  }

  try {

    // Use the search service which includes occupancy filtering
    logger.info({ filters }, 'Searching boxes with filters');
    const boxes = await searchBoxes(filters);

    logger.info({ 
      boxCount: boxes?.length || 0,
      filtersApplied: Object.keys(filters).length
    }, `Box search completed: ${boxes?.length || 0} results`);

    // Always return an array, even if empty
    return NextResponse.json(boxes || []);
  } catch (error) {
    logger.error({ error, filters }, 'Error searching boxes');
    // Return empty array for graceful degradation instead of error
    // This allows the frontend to handle empty state properly
    return NextResponse.json([]);
  }
}

const createBox = withAuth(async (request: NextRequest, { profileId }) => {
  const startTime = Date.now();
  let data: Record<string, unknown> | undefined;
  try {
    data = await request.json();
    if (!data) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }
    
    logger.info({ boxData: data, userId: profileId }, 'Creating new box');
    
    // Map to Prisma schema format (camelCase)
    const boxData = {
      name: data.name as string,
      description: data.description as string,
      price: data.price as number,
      size: data.size as 'SMALL' | 'MEDIUM' | 'LARGE' | undefined,
      stableId: (data.stableId || data.stable_id) as string,
      boxType: (data.boxType || data.box_type) as BoxType,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable as boolean : data.is_available as boolean,
      images: (data.images || []) as string[],
      imageDescriptions: (data.imageDescriptions || data.image_descriptions || []) as string[],
      updatedAt: new Date(),
      amenityIds: data.amenityIds as string[]
      // Note: isIndoor, hasWindow, hasElectricity, hasWater removed - use amenities instead
    };
    
    // Validate required fields
    if (!boxData.name || !boxData.price || !boxData.stableId) {
      return NextResponse.json(
        { error: 'Name, price, and stableId are required' },
        { status: 400 }
      );
    }

    // Check if stable exists AND user owns it
    const stable = await prisma.stables.findUnique({
      where: { id: boxData.stableId },
      select: { id: true, ownerId: true }
    });
    
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (stable.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only create boxes for your own stables' },
        { status: 403 }
      );
    }

    const box = await createBoxServer(boxData);
    const duration = Date.now() - startTime;
    
    logBusinessOperation('create_box', 'success', {
      resourceId: box.id,
      resourceType: 'box',
      duration,
      details: { 
        name: box.name, 
        stableId: box.stableId,
        price: box.price 
      }
    });
    
    logger.info({ 
      boxId: box.id, 
      stableId: box.stableId,
      duration 
    }, 'Box created successfully');
    
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logBusinessOperation('create_box', 'failure', {
      duration,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(data && { stableId: data.stableId || data.stable_id })
      }
    });
    
    logger.error({ 
      error,
      ...(data && { boxData: data }),
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }, 'Failed to create box');
    
    return NextResponse.json(
      { error: 'Failed to create box' },
      { status: 500 }
    );
  }
});

export const GET = withApiLogging(getBoxes);
export const POST = createBox;