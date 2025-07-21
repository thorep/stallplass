import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Get stables with owner information
    const { data: stables, error } = await supabaseServer
      .from('staller')
      .select(`
        *,
        eier:brukere!staller_eier_id_fkey (
          id,
          email,
          name
        )
      `)
      .order('opprettet_dato', { ascending: false });

    if (error) {
      throw error;
    }

    // Get counts for boxes, conversations, and rentals for each stable
    const stablesWithCounts = await Promise.all(
      stables.map(async (stable) => {
        // Count boxes
        const { count: boxesCount, error: boxesError } = await supabaseServer
          .from('stallplasser')
          .select('*', { count: 'exact', head: true })
          .eq('stall_id', stable.id);

        if (boxesError) throw boxesError;

        // Count conversations
        const { count: conversationsCount, error: conversationsError } = await supabaseServer
          .from('samtaler')
          .select('*', { count: 'exact', head: true })
          .eq('stall_id', stable.id);

        if (conversationsError) throw conversationsError;

        // Count rentals
        const { count: rentalsCount, error: rentalsError } = await supabaseServer
          .from('utleie')
          .select('*', { count: 'exact', head: true })
          .eq('stall_id', stable.id);

        if (rentalsError) throw rentalsError;

        return {
          ...stable,
          _count: {
            boxes: boxesCount || 0,
            conversations: conversationsCount || 0,
            rentals: rentalsCount || 0,
          }
        };
      })
    );

    return NextResponse.json(stablesWithCounts);
  } catch (error) {
    console.error('Error fetching stables:', error);
    return NextResponse.json({ error: 'Failed to fetch stables' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('staller')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stable:', error);
    return NextResponse.json({ error: 'Failed to delete stable' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, featured } = body;

    if (!id) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    const { data: stable, error } = await supabaseServer
      .from('staller')
      .update({ featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(stable);
  } catch (error) {
    console.error('Error updating stable:', error);
    return NextResponse.json({ error: 'Failed to update stable' }, { status: 500 });
  }
}