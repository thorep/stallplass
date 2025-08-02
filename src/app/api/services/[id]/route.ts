import { NextRequest, NextResponse } from 'next/server';
import { 
  getServiceById,
  updateService,
  deleteService 
} from '@/services/marketplace-service';
import { withAuth } from '@/lib/supabase-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await getServiceById(id);
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(service);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const body = await request.json();
    
    // Validate service type if provided
    if (body.service_type && !['veterinarian', 'farrier', 'trainer'].includes(body.service_type)) {
      return NextResponse.json(
        { error: 'Invalid service_type. Must be veterinarian, farrier, or trainer' },
        { status: 400 }
      );
    }

    // Validate areas structure if provided
    if (body.areas && (!Array.isArray(body.areas) || body.areas.some((area: { county?: string }) => !area.county))) {
      return NextResponse.json(
        { error: 'Areas must be an array of objects with at least a county field' },
        { status: 400 }
      );
    }

    const serviceData = {
      title: body.title,
      description: body.description,
      service_type: body.service_type,
      price_range_min: body.price_range_min,
      price_range_max: body.price_range_max,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      is_active: body.is_active,
      areas: body.areas,
      photos: body.photos
    };

    const { id } = await params;
    const service = await updateService(id, serviceData, profileId);
    return NextResponse.json(service);
  } catch (error) {
    
    if (error instanceof Error && error.message.includes('No rows')) {
      return NextResponse.json(
        { error: 'Service not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    await deleteService(id, profileId);
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
});