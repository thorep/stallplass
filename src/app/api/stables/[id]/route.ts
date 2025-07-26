import { NextRequest, NextResponse } from 'next/server';
import { getStableById, updateStable, deleteStable } from '@/services/stable-service';

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
  } catch (error) {
    console.error('Error fetching stable:', error);
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
    const params = await context.params;
    const body = await request.json();
    
    const updateData = {
      name: body.name,
      description: body.description,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
      county: body.county,
      images: body.images,
      imageDescriptions: body.imageDescriptions,
      amenityIds: body.amenityIds
    };

    const stable = await updateStable(params.id, updateData);
    return NextResponse.json(stable);
  } catch (error) {
    console.error('Error updating stable:', error);
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
    const params = await context.params;
    await deleteStable(params.id);
    return NextResponse.json({ message: 'Stable deleted successfully' });
  } catch (error) {
    console.error('Error deleting stable:', error);
    return NextResponse.json(
      { error: 'Failed to delete stable' },
      { status: 500 }
    );
  }
}