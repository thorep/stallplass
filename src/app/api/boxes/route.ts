import { NextRequest, NextResponse } from 'next/server';
import { createBox, searchBoxes, BoxFilters } from '@/services/stallplass-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search/filter parameters
    const filters: BoxFilters = {};
    
    if (searchParams.get('stable_id')) {
      filters.stall_id = searchParams.get('stable_id')!;
    }
    
    if (searchParams.get('is_available')) {
      filters.er_tilgjengelig = searchParams.get('is_available') === 'true';
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
    
    if (searchParams.get('is_indoor')) {
      filters.er_innendors = searchParams.get('is_indoor') === 'true';
    }
    
    if (searchParams.get('has_window')) {
      filters.har_vindu = searchParams.get('has_window') === 'true';
    }
    
    if (searchParams.get('has_electricity')) {
      filters.har_strom = searchParams.get('has_electricity') === 'true';
    }
    
    if (searchParams.get('has_water')) {
      filters.har_vann = searchParams.get('has_water') === 'true';
    }
    
    if (searchParams.get('max_horse_size')) {
      filters.maks_hest_storrelse = searchParams.get('max_horse_size')!;
    }
    
    if (searchParams.get('amenityIds')) {
      filters.fasilitetIds = searchParams.get('amenityIds')!.split(',');
    }

    // Use the search service which includes occupancy filtering
    const boxes = await searchBoxes(filters);

    // Always return an array, even if empty
    return NextResponse.json(boxes || []);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    
    // Return empty array for graceful degradation instead of error
    // This allows the frontend to handle empty state properly
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating box with data:', data);
    
    // Validate required fields
    if (!data.name || !data.maanedlig_pris || !data.stall_id) {
      return NextResponse.json(
        { error: 'Name, maanedlig_pris, and stall_id are required' },
        { status: 400 }
      );
    }

    // Check if stall exists
    const { data: stall, error: stallError } = await supabaseServer
      .from('staller')
      .select('id')
      .eq('id', data.stall_id)
      .single();
    
    if (stallError || !stall) {
      console.error('Stall not found:', data.stall_id, stallError);
      return NextResponse.json(
        { error: 'Stall not found' },
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