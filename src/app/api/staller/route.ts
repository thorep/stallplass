import { NextRequest, NextResponse } from 'next/server';
import { 
  hentAlleStaller, 
  hentOffentligeStaller, 
  opprettStall, 
  sokStaller,
} from '@/services/stable-service';
import { StableSearchFilters } from '@/types/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search filters for database search
    const filters: StableSearchFilters = {};
    
    if (searchParams.get('sokeord')) {
      filters.query = searchParams.get('sokeord')!;
    }
    
    if (searchParams.get('lokasjon')) {
      filters.location = searchParams.get('lokasjon')!;
    }
    
    if (searchParams.get('fasilitetIds')) {
      filters.amenityIds = searchParams.get('fasilitetIds')!.split(',');
    }
    
    // Check if we should get all stables or just public ones
    const alleStaller = searchParams.get('alle') === 'true';
    
    let stables;
    if (Object.keys(filters).length > 0) {
      stables = await sokStaller(filters);
    } else if (alleStaller) {
      stables = await hentAlleStaller();
    } else {
      stables = await hentOffentligeStaller();
    }

    return NextResponse.json(stables);
  } catch (error) {
    console.error('Error fetching stables:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating stall with data:', data);
    
    // Validate required fields
    if (!data.name || !data.description || !data.location || !data.owner_id || !data.owner_name) {
      return NextResponse.json(
        { error: 'Name, description, location, owner_id, and owner_name are required' },
        { status: 400 }
      );
    }

    const stall = await opprettStall(data);
    
    return NextResponse.json(stall, { status: 201 });
  } catch (error) {
    console.error('Error creating stall:', error);
    return NextResponse.json(
      { error: 'Failed to create stall' },
      { status: 500 }
    );
  }
}