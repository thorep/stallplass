import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllStables, 
  getAllStablesWithBoxStats,
  getStablesByOwner, 
  createStable, 
  searchStables
} from '@/services/stable-service';
import { StableSearchFilters } from '@/types/services';
import { withAuth, authenticateRequest } from '@/lib/supabase-auth-middleware';

async function getStables(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('owner_id');
    const withBoxStats = searchParams.get('withBoxStats') === 'true';
    
    // Build search filters
    const filters: StableSearchFilters = {
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      amenityIds: searchParams.get('fasilitetIds')?.split(',').filter(Boolean),
      hasAvailableBoxes: searchParams.get('hasAvailableBoxes') === 'true' || undefined,
      maxHorseSize: searchParams.get('max_horse_size') || undefined
    };

    if (ownerId && withBoxStats) {
      // Fetch stables for a specific owner with box statistics - requires authentication
      const authResult = await authenticateRequest(request);
      if (!authResult || authResult.uid !== ownerId) {
        return NextResponse.json(
          { error: 'Unauthorized - can only fetch your own stables' },
          { status: 401 }
        );
      }
      
      const stables = await getStablesByOwner(ownerId);
      
      // Add box statistics to each stable
      const stablesWithStats = await Promise.all(
        stables.map(async (stable) => {
          const { getTotalBoxesCount, getAvailableBoxesCount, getBoxPriceRange } = await import('@/services/box-service');
          const totalBoxes = await getTotalBoxesCount(stable.id);
          const availableBoxes = await getAvailableBoxesCount(stable.id);
          const priceRange = await getBoxPriceRange(stable.id) || { min: 0, max: 0 };

          return {
            ...stable,
            totalBoxes: totalBoxes,
            available_boxes: availableBoxes,
            priceRange
          };
        })
      );
      
      return NextResponse.json(stablesWithStats);
    } else if (ownerId) {
      // Fetch stables for a specific owner (without box stats) - requires authentication
      const authResult = await authenticateRequest(request);
      if (!authResult || authResult.uid !== ownerId) {
        return NextResponse.json(
          { error: 'Unauthorized - can only fetch your own stables' },
          { status: 401 }
        );
      }
      
      const stables = await getStablesByOwner(ownerId);
      return NextResponse.json(stables);
    } else if (withBoxStats) {
      // Fetch stables with box statistics (for listings)
      const stables = await getAllStablesWithBoxStats();
      return NextResponse.json(stables);
    } else if (Object.values(filters).some(value => value !== undefined)) {
      // Search/filter stables
      const stables = await searchStables(filters);
      return NextResponse.json(stables);
    } else {
      // Fetch all stables
      const stables = await getAllStables();
      return NextResponse.json(stables);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stables' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json();
    
    const stableData = {
      name: body.name,
      description: body.description,
      location: body.location || body.city || '', // location is required
      totalBoxes: body.totalBoxes,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode || body.postal_code, // Handle both field names
      county: body.county,
      municipality: body.municipality, // Kommune name for location data
      kommuneNumber: body.kommuneNumber, // Kommune number for location lookup
      latitude: body.coordinates?.lat || null,
      longitude: body.coordinates?.lon || null,
      images: body.images || [],
      imageDescriptions: body.image_descriptions || body.imageDescriptions || [],
      amenityIds: body.amenityIds || body.fasilitetIds || [], // Array of amenity IDs
      ownerId: userId, // Use authenticated user ID
      updatedAt: new Date() // Required field
    };

    const stable = await createStable(stableData);
    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create stable' },
      { status: 500 }
    );
  }
});

export const GET = getStables;