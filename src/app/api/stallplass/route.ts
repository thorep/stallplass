import { NextRequest, NextResponse } from 'next/server';
import { createStallplass, searchStallplasser, StallplassFilters } from '@/services/stallplass-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search/filter parameters
    const filters: StallplassFilters = {};
    
    if (searchParams.get('stall_id')) {
      filters.stall_id = searchParams.get('stall_id')!;
    }
    
    if (searchParams.get('er_tilgjengelig')) {
      filters.er_tilgjengelig = searchParams.get('er_tilgjengelig') === 'true';
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
    
    if (searchParams.get('er_innendors')) {
      filters.er_innendors = searchParams.get('er_innendors') === 'true';
    }
    
    if (searchParams.get('har_vindu')) {
      filters.har_vindu = searchParams.get('har_vindu') === 'true';
    }
    
    if (searchParams.get('har_strom')) {
      filters.har_strom = searchParams.get('har_strom') === 'true';
    }
    
    if (searchParams.get('har_vann')) {
      filters.har_vann = searchParams.get('har_vann') === 'true';
    }
    
    if (searchParams.get('maks_hest_storrelse')) {
      filters.maks_hest_storrelse = searchParams.get('maks_hest_storrelse')!;
    }
    
    if (searchParams.get('fasilitetIds')) {
      filters.fasilitetIds = searchParams.get('fasilitetIds')!.split(',');
    }

    // Use the search service which includes occupancy filtering
    const stallplasser = await searchStallplasser(filters);

    // Always return an array, even if empty
    return NextResponse.json(stallplasser || []);
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
    
    console.log('Creating stallplass with data:', data);
    
    // Validate required fields
    if (!data.name || !data.grunnpris || !data.stall_id) {
      return NextResponse.json(
        { error: 'Name, grunnpris, and stall_id are required' },
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

    const stallplass = await createStallplass(data);
    
    return NextResponse.json(stallplass, { status: 201 });
  } catch (error) {
    console.error('Error creating stallplass:', error);
    return NextResponse.json(
      { error: 'Failed to create stallplass' },
      { status: 500 }
    );
  }
}