import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { 
  updateServiceType, 
  deleteServiceType,
  getServiceTypeById 
} from '@/services/service-type-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const serviceType = await getServiceTypeById(id);
    
    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(serviceType);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service type' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const { name, displayName, isActive } = body;
    
    // Validate at least one field is provided
    if (name === undefined && displayName === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name, displayName, isActive) must be provided' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate displayName if provided
    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json(
        { error: 'Display name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }
    
    const serviceType = await updateServiceType(id, {
      name: name !== undefined ? name.trim() : undefined,
      displayName: displayName !== undefined ? displayName.trim() : undefined,
      isActive
    });
    
    return NextResponse.json(serviceType);
  } catch (error) {
    
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
      { error: 'Failed to update service type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    
    await deleteServiceType(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Cannot delete service type')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete service type' },
      { status: 500 }
    );
  }
}