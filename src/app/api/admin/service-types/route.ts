import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { 
  getAllServiceTypes, 
  createServiceType 
} from '@/services/service-type-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const serviceTypes = await getAllServiceTypes();
    return NextResponse.json(serviceTypes);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service types' },
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
    const { name, displayName, isActive } = body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }
    
    const serviceType = await createServiceType({
      name: name.trim(),
      displayName: displayName.trim(),
      isActive: isActive ?? true
    });
    
    return NextResponse.json(serviceType);
  } catch (error) {
    
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
      { error: 'Failed to create service type' },
      { status: 500 }
    );
  }
}