import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllServices, 
  getServicesByUser,
  searchServices,
  createService,
  ServiceSearchFilters 
} from '@/services/marketplace-service';
import { withAuth, authenticateRequest } from '@/lib/supabase-auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    // Build search filters
    const filters: ServiceSearchFilters = {
      service_type: searchParams.get('service_type') as 'veterinarian' | 'farrier' | 'trainer' || undefined,
      county: searchParams.get('county') || undefined,
      municipality: searchParams.get('municipality') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    };

    if (userId) {
      // Fetch services for a specific user - requires authentication
      const authResult = await authenticateRequest(request);
      if (!authResult || authResult.uid !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized - can only fetch your own services' },
          { status: 401 }
        );
      }
      
      const services = await getServicesByUser(userId);
      return NextResponse.json(services);
    } else if (Object.values(filters).some(value => value !== undefined)) {
      // Search/filter services
      const services = await searchServices(filters);
      return NextResponse.json(services);
    } else {
      // Fetch all active services
      const services = await getAllServices();
      return NextResponse.json(services);
    }
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.service_type || !body.areas || body.areas.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, service_type, and areas are required' },
        { status: 400 }
      );
    }

    // Validate service type
    if (!['veterinarian', 'farrier', 'trainer'].includes(body.service_type)) {
      return NextResponse.json(
        { error: 'Invalid service_type. Must be veterinarian, farrier, or trainer' },
        { status: 400 }
      );
    }

    // Validate areas structure
    if (!Array.isArray(body.areas) || body.areas.some((area: { county?: string }) => !area.county)) {
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
      areas: body.areas,
      photos: body.photos || []
    };

    const service = await createService(serviceData, userId);
    return NextResponse.json(service, { status: 201 });
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
});