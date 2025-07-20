import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';

type EntityType = Database['public']['Enums']['entity_type'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, viewerId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const validEntityTypes: EntityType[] = ['STABLE', 'BOX'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Create the page view record
    const { data: pageView, error } = await supabaseServer
      .from('page_views')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        viewer_id: viewerId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(pageView, { status: 201 });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}