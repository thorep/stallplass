import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: amenities, error } = await supabaseServer
      .from('box_amenities')
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