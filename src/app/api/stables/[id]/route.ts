import { NextRequest, NextResponse } from 'next/server';
import { getStableById, updateStable, deleteStable } from '@/services/stable-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const stable = await getStableById(params.id);
    
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stable);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stable' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    
    // First, check if the stable exists and if the user owns it
    const stable = await getStableById(params.id);
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (stable.ownerId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only update your own stables' },
        { status: 403 }
      );
    }
    
    const updateData = {
      name: body.name,
      description: body.description,
      address: body.address,
      postalCode: body.postalCode,
      postalPlace: body.poststed || body.city, // Map poststed to postalPlace
      latitude: body.coordinates?.lat || null,
      longitude: body.coordinates?.lon || null,
      images: body.images,
      imageDescriptions: body.imageDescriptions,
      amenityIds: body.amenityIds
      // Note: countyId and municipalityId would need to be looked up from the county/municipality tables
      // but for now we'll omit them since the form works with the basic address fields
    };

    const updatedStable = await updateStable(params.id, updateData);
    return NextResponse.json(updatedStable);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update stable' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    
    // First, check if the stable exists and if the user owns it
    const stable = await getStableById(params.id);
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (stable.ownerId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own stables' },
        { status: 403 }
      );
    }
    
    await deleteStable(params.id);
    return NextResponse.json({ message: 'Stable deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete stable' },
      { status: 500 }
    );
  }
}