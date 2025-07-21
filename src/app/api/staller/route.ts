import { NextRequest, NextResponse } from 'next/server';
import { 
  hentAlleStaller, 
  hentOffentligeStaller, 
  opprettStall, 
  sokStaller,
  // type StallFilter 
} from '@/services/stable-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse Norwegian search parameters
    const filters: any = {}; // TODO: Fix StallFilter type
    
    if (searchParams.get('eier_id')) {
      filters.eier_id = searchParams.get('eier_id')!;
    }
    
    if (searchParams.get('reklame_aktiv')) {
      filters.reklame_aktiv = searchParams.get('reklame_aktiv') === 'true';
    }
    
    if (searchParams.get('featured')) {
      filters.featured = searchParams.get('featured') === 'true';
    }
    
    if (searchParams.get('sokeord')) {
      filters.sokeord = searchParams.get('sokeord')!;
    }
    
    if (searchParams.get('lokasjon')) {
      filters.lokasjon = searchParams.get('lokasjon')!;
    }
    
    if (searchParams.get('minRating')) {
      filters.minRating = parseFloat(searchParams.get('minRating')!);
    }
    
    if (searchParams.get('fasilitetIds')) {
      filters.fasilitetIds = searchParams.get('fasilitetIds')!.split(',');
    }
    
    // Check if we should get all staller or just public ones
    const alleStaller = searchParams.get('alle') === 'true';
    
    let staller;
    if (Object.keys(filters).length > 0) {
      staller = await sokStaller(filters);
    } else if (alleStaller) {
      staller = await hentAlleStaller();
    } else {
      staller = await hentOffentligeStaller();
    }

    return NextResponse.json(staller);
  } catch (error) {
    console.error('Error fetching staller:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating stall with data:', data);
    
    // Validate required fields
    if (!data.name || !data.description || !data.location || !data.eier_id || !data.eier_navn) {
      return NextResponse.json(
        { error: 'Name, description, location, eier_id, and eier_navn are required' },
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