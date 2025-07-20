import { NextRequest, NextResponse } from 'next/server';
import { createBox, searchBoxes, BoxFilters } from '@/services/box-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search/filter parameters
    const filters: BoxFilters = {};
    
    if (searchParams.get('stable_id')) {
      filters.stable_id = searchParams.get('stable_id')!;
    }
    
    if (searchParams.get('is_available')) {
      filters.is_available = searchParams.get('is_available') === 'true';
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
      filters.is_indoor = searchParams.get('is_indoor') === 'true';
    }
    
    if (searchParams.get('has_window')) {
      filters.has_window = searchParams.get('has_window') === 'true';
    }
    
    if (searchParams.get('has_electricity')) {
      filters.has_electricity = searchParams.get('has_electricity') === 'true';
    }
    
    if (searchParams.get('has_water')) {
      filters.has_water = searchParams.get('has_water') === 'true';
    }
    
    if (searchParams.get('max_horse_size')) {
      filters.max_horse_size = searchParams.get('max_horse_size')!;
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
    if (!data.name || !data.price || !data.stable_id) {
      return NextResponse.json(
        { error: 'Name, price, and stable_id are required' },
        { status: 400 }
      );
    }

    // Check if stable exists
    const { data: stable, error: stableError } = await supabaseServer
      .from('stables')
      .select('id')
      .eq('id', data.stable_id)
      .single();
    
    if (stableError || !stable) {
      console.error('Stable not found:', data.stable_id, stableError);
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