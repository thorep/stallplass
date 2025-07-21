import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { data: amenities, error } = await supabaseServer
      .from('stallplass_fasiliteter')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching box amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name } = body;
    
    const { data: amenity, error } = await supabaseServer
      .from('stallplass_fasiliteter')
      .insert({ name })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error creating box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to create box amenity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, name } = body;
    
    const { data: amenity, error } = await supabaseServer
      .from('stallplass_fasiliteter')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error updating box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to update box amenity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabaseServer
      .from('stallplass_fasiliteter')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to delete box amenity' },
      { status: 500 }
    );
  }
}