import { NextRequest, NextResponse } from 'next/server';
import { 
  getServiceById,
  updateService,
  deleteService 
} from '@/services/marketplace-service';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { createApiLogger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

const apiLogger = createApiLogger({ 
  endpoint: "/api/services/:id", 
  requestId: crypto.randomUUID() 
});

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

    // Services are always publicly visible if active
    const isPubliclyVisible = service.isActive;

    // If publicly visible, return to anyone (no auth required)
    if (isPubliclyVisible) {
      return NextResponse.json(service);
    }

    // If not publicly visible, only owner can view
    const user = await getAuthUser();
    const isOwner = user && user.id === service.userId;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Return service with ownership flag for owner
    return NextResponse.json({
      ...service,
      isOwnerView: true,
      requiresAdvertising: false // No longer using advertising system
    });
  } catch (error) {
    const { id } = await params;
    try { captureApiError({ error, context: 'service_get', route: '/api/services/[id]', method: 'GET', serviceId: id }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    const body = await request.json();
    
    // Validate service type if provided
    if (body.service_type_id) {
      try {
        const { getActiveServiceTypes } = await import('@/services/service-type-service');
        const activeServiceTypes = await getActiveServiceTypes();
        const validServiceTypeIds = activeServiceTypes.map(st => st.id);
        
        if (!validServiceTypeIds.includes(body.service_type_id)) {
          return NextResponse.json(
            { error: `Invalid service_type_id. Must be one of: ${validServiceTypeIds.join(', ')}` },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to validate service type' },
          { status: 500 }
        );
      }
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
      service_type_id: body.service_type_id,
      price_range_min: body.price_range_min,
      price_range_max: body.price_range_max,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      is_active: body.is_active,
      areas: body.areas,
      photos: body.photos,
      photoDescriptions: body.photoDescriptions,
      // Address fields
      address: body.address,
      postalCode: body.postalCode,
      postalPlace: body.postalPlace,
      latitude: body.latitude,
      longitude: body.longitude,
      countyId: body.countyId,
      municipalityId: body.municipalityId
    };

    const { id } = await params;
    const service = await updateService(id, serviceData, user.id);
    return NextResponse.json(service);
  } catch (error) {
    apiLogger.error({
      method: 'PUT',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    const { id } = await params;
    try { captureApiError({ error, context: 'service_update_put', route: '/api/services/[id]', method: 'PUT', serviceId: id, distinctId: user.id }); } catch {}
    
    
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    const { id } = await params;
    await deleteService(id, user.id);
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    const { id } = await params;
    try { captureApiError({ error, context: 'service_delete', route: '/api/services/[id]', method: 'DELETE', serviceId: id }); } catch {}
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
