import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Get boxes with stable information and owner details
    const { data: boxes, error } = await supabaseServer
      .from('boxes')
      .select(`
        *,
        stable:stables (
          id,
          name,
          owner_id,
          owner:users (
            email,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get counts for conversations and rentals for each box
    const boxesWithCounts = await Promise.all(
      boxes.map(async (box) => {
        // Count conversations
        const { count: conversationsCount, error: conversationsError } = await supabaseServer
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('box_id', box.id);

        if (conversationsError) throw conversationsError;

        // Count rentals
        const { count: rentalsCount, error: rentalsError } = await supabaseServer
          .from('rentals')
          .select('*', { count: 'exact', head: true })
          .eq('box_id', box.id);

        if (rentalsError) throw rentalsError;

        // Transform the response to match the expected format
        return {
          ...box,
          stable: {
            id: box.stable?.id,
            name: box.stable?.name,
            owner_id: box.stable?.owner_id,
            owner: Array.isArray(box.stable?.owner) 
              ? { email: box.stable.owner[0]?.email, name: box.stable.owner[0]?.name }
              : { email: box.stable?.owner?.email, name: box.stable?.owner?.name }
          },
          _count: {
            conversations: conversationsCount || 0,
            rentals: rentalsCount || 0,
          }
        };
      })
    );

    return NextResponse.json(boxesWithCounts);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'Box ID is required' }, { status: 400 });
    }

    const updateData: { is_available?: boolean } = {};
    if (typeof isAvailable === 'boolean') updateData.is_available = isAvailable;

    const { data: box, error } = await supabaseServer
      .from('boxes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(box);
  } catch {
    return NextResponse.json({ error: 'Failed to update box' }, { status: 500 });
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
      return NextResponse.json({ error: 'Box ID is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('boxes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 });
  }
}