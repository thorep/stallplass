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
        .from('utleie')
        .select(`
          *,
          box:stallplasser (
            id,
            name,
            description,
            price,
            size,
            er_innendors,
            har_vindu,
            har_strom,
            har_vann,
            maks_hest_storrelse,
            images
          ),
          stable:staller (
            id,
            name,
            location,
            eier_navn,
            owner_phone,
            owner_email
          )
        `)
        .eq('rider_id', userId)
        .eq('status', 'ACTIVE')
        .order('opprettet_dato', { ascending: false });

      if (error) {
        console.error('Error fetching renter rentals:', error);
        return NextResponse.json({ error: 'Error fetching rentals' }, { status: 500 });
      }

      return NextResponse.json(rentals);
    } else if (type === 'owner') {
      // Get rentals for stables owned by the user
      const { data: rentals, error } = await supabaseServer
        .from('utleie')
        .select(`
          *,
          box:stallplasser (
            id,
            name,
            description,
            price,
            size,
            er_innendors,
            har_vindu,
            har_strom,
            har_vann,
            maks_hest_storrelse,
            images
          ),
          stable:staller!inner (
            id,
            name,
            location
          ),
          rider:brukere (
            id,
            name,
            email
          )
        `)
        .eq('staller.eier_id', userId)
        .eq('status', 'ACTIVE')
        .order('opprettet_dato', { ascending: false });

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