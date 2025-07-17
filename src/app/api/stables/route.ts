import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllStables, 
  getStablesByOwner, 
  createStable, 
  searchStables 
} from '@/services/stable-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const query = searchParams.get('query');
    const amenityIds = searchParams.get('amenityIds')?.split(',').filter(Boolean);
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const location = searchParams.get('location');

    if (ownerId) {
      // Fetch stables for a specific owner
      const stables = await getStablesByOwner(ownerId);
      return NextResponse.json(stables);
    } else if (query || amenityIds || minPrice || maxPrice || location) {
      // Search/filter stables
      const stables = await searchStables(query || undefined, amenityIds, minPrice, maxPrice, location || undefined);
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
      location: body.location,
      price: body.price,
      availableSpaces: body.availableSpaces,
      totalSpaces: body.totalSpaces,
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