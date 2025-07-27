import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { 
  getAllBoxAmenities, 
  createBoxAmenity, 
  updateBoxAmenity, 
  deleteBoxAmenity 
} from '@/services/amenity-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const amenities = await getAllBoxAmenities();
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
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const amenity = await createBoxAmenity(name);
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error creating box amenity:', error);
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
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
    
    if (!id || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }
    
    const amenity = await updateBoxAmenity(id, name);
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error updating box amenity:', error);
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
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
    
    await deleteBoxAmenity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box amenity:', error);
    
    // Handle known errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete box amenity' },
      { status: 500 }
    );
  }
}