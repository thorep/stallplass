import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllStables, 
  getAllStablesWithBoxStats,
  getStablesByOwner, 
  createStable, 
  searchStables,
  StableSearchFilters
} from '@/services/stable-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const withBoxStats = searchParams.get('withBoxStats') === 'true';
    
    // Build search filters
    const filters: StableSearchFilters = {
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      amenityIds: searchParams.get('amenityIds')?.split(',').filter(Boolean),
      hasAvailableBoxes: searchParams.get('hasAvailableBoxes') === 'true' || undefined,
      isIndoor: searchParams.get('isIndoor') ? searchParams.get('isIndoor') === 'true' : undefined,
      hasWindow: searchParams.get('hasWindow') ? searchParams.get('hasWindow') === 'true' : undefined,
      hasElectricity: searchParams.get('hasElectricity') ? searchParams.get('hasElectricity') === 'true' : undefined,
      hasWater: searchParams.get('hasWater') ? searchParams.get('hasWater') === 'true' : undefined,
      maxHorseSize: searchParams.get('maxHorseSize') || undefined
    };

    if (ownerId && withBoxStats) {
      // Fetch stables for a specific owner with box statistics
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
            totalBoxes,
            availableBoxes,
            priceRange
          };
        })
      );
      
      return NextResponse.json(stablesWithStats);
    } else if (ownerId) {
      // Fetch stables for a specific owner (without box stats)
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
    console.error('Error fetching stables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const stableData = {
      name: body.name,
      description: body.description,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
      county: body.county,
      latitude: body.coordinates?.lat || null,
      longitude: body.coordinates?.lon || null,
      images: body.images || [],
      amenityIds: body.amenityIds || [], // Array of amenity IDs
      ownerId: body.ownerId,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
      ownerEmail: body.ownerEmail,
      featured: body.featured || false
    };

    const stable = await createStable(stableData);
    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    console.error('Error creating stable:', error);
    return NextResponse.json(
      { error: 'Failed to create stable' },
      { status: 500 }
    );
  }
}