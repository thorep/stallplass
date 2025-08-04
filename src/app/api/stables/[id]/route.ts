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
    
    // Build update data - only include fields that are provided
    const updateData: {
      name?: string;
      description?: string;
      address?: string;
      postalCode?: string;
      postalPlace?: string;
      latitude?: number;
      longitude?: number;
      images?: string[];
      imageDescriptions?: string[];
      amenityIds?: string[];
    } = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.poststed !== undefined || body.city !== undefined) {
      updateData.postalPlace = body.poststed || body.city;
    }
    if (body.coordinates?.lat !== undefined) updateData.latitude = body.coordinates.lat;
    if (body.coordinates?.lon !== undefined) updateData.longitude = body.coordinates.lon;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.imageDescriptions !== undefined) updateData.imageDescriptions = body.imageDescriptions;
    if (body.amenityIds !== undefined) updateData.amenityIds = body.amenityIds;

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