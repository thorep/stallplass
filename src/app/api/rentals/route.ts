import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'renter' or 'owner'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (type === 'renter') {
      // Get rentals where user is the renter
      const { data: rentals, error } = await supabaseServer
        .from('rentals')
        .select(`
          *,
          box:boxes (
            id,
            name,
            description,
            price,
            size,
            is_indoor,
            has_window,
            has_electricity,
            has_water,
            max_horse_size,
            images
          ),
          stable:stables (
            id,
            name,
            location,
            owner_name,
            owner_phone,
            owner_email
          )
        `)
        .eq('rider_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching renter rentals:', error);
        return NextResponse.json({ error: 'Error fetching rentals' }, { status: 500 });
      }

      return NextResponse.json(rentals);
    } else if (type === 'owner') {
      // Get rentals for stables owned by the user
      const { data: rentals, error } = await supabaseServer
        .from('rentals')
        .select(`
          *,
          box:boxes (
            id,
            name,
            description,
            price,
            size,
            is_indoor,
            has_window,
            has_electricity,
            has_water,
            max_horse_size,
            images
          ),
          stable:stables!inner (
            id,
            name,
            location
          ),
          rider:users (
            id,
            name,
            email
          )
        `)
        .eq('stables.owner_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching owner rentals:', error);
        return NextResponse.json({ error: 'Error fetching rentals' }, { status: 500 });
      }

      return NextResponse.json(rentals);
    } else {
      return NextResponse.json(
        { error: 'Type parameter must be either "renter" or "owner"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}