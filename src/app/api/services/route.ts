import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllServices, 
  getServicesByProfile,
  searchServices,
  createService,
  ServiceSearchFilters 
} from '@/services/marketplace-service';
import { getActiveServiceTypes } from '@/services/service-type-service';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get services with optional filtering
 *     description: |
 *       Retrieves services based on query parameters:
 *       - No params: All active services
 *       - With filters: Search/filter services by type, location, price
 *       - `user_id`: Services owned by specific user (requires authentication and must be own services)
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter services by owner ID (requires authentication, can only access own services)
 *       - in: query
 *         name: service_type
 *         schema:
 *           type: string
 *           enum: [veterinarian, farrier, trainer, chiropractor, saddlefitter, equestrian_shop]
 *         description: Filter by service type
 *       - in: query
 *         name: county
 *         schema:
 *           type: string
 *         description: Filter by county/fylke
 *       - in: query
 *         name: municipality
 *         schema:
 *           type: string
 *         description: Filter by municipality/kommune
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *     security:
 *       - BearerAuth: []
 *         description: Required only when using user_id parameter
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized - Invalid token or attempting to access other user's services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized - can only fetch your own services"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
      const authResult = await requireAuth();
      if (authResult instanceof NextResponse) return authResult;
      const user = authResult;
      if (user.id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized - can only fetch your own services' },
          { status: 401 }
        );
      }
      
      const services = await getServicesByProfile(userId);
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
  } catch (error) {
    logger.error('❌ GET services failed:', error);
    logger.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     description: Creates a new service listing for the authenticated user. Services are professional services like veterinarians, farriers, trainers, etc.
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, service_type, contact_name, areas]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Service title (required)
 *               description:
 *                 type: string
 *                 description: Detailed service description (required)
 *               service_type:
 *                 type: string
 *                 enum: [veterinarian, farrier, trainer, chiropractor, saddlefitter, equestrian_shop]
 *                 description: Type of service (required)
 *               price_range_min:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Minimum price for service
 *               price_range_max:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Maximum price for service
 *               contact_name:
 *                 type: string
 *                 description: Contact person name (required)
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *               contact_phone:
 *                 type: string
 *                 description: Contact phone number
 *               areas:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [county]
 *                   properties:
 *                     county:
 *                       type: string
 *                       description: County/fylke where service is offered (required)
 *                     municipality:
 *                       type: string
 *                       description: Municipality/kommune where service is offered
 *                 description: Areas where service is offered (required, at least one)
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of photo URLs for the service
 *               photoDescriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of photo descriptions (corresponding to photos)
 *           example:
 *             title: "Veterinærtjenester Oslo"
 *             description: "Erfaren veterinær med spesialisering på hester. Tilbyr rutinesjekk, vaksinering og akuttbehandling."
 *             service_type: "veterinarian"
 *             price_range_min: 800
 *             price_range_max: 2500
 *             contact_name: "Dr. Anne Hansen"
 *             contact_email: "anne@veterinar.no"
 *             contact_phone: "+47 12345678"
 *             areas:
 *               - county: "Oslo"
 *                 municipality: "Oslo"
 *               - county: "Akershus"
 *                 municipality: "Bærum"
 *             photos: ["https://example.com/vet1.jpg", "https://example.com/vet2.jpg"]
 *             photoDescriptions: ["Veterinær ved arbeid", "Klinikk eksteriør"]
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_required_fields:
 *                 value:
 *                   error: "Missing required fields: title, description, service_type, contact_name, and areas are required"
 *               invalid_service_type:
 *                 value:
 *                   error: "Invalid service_type. Must be one of: veterinarian, farrier, trainer, chiropractor, saddlefitter, equestrian_shop"
 *               invalid_areas:
 *                 value:
 *                   error: "Areas must be an array of objects with at least a county field"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  const profileId = user.id;
  try {
    const body = await request.json();
    logger.info('🔧 API received:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.title || !body.description || !body.service_type_id || !body.contact_name || !body.areas || body.areas.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, service_type_id, contact_name, and areas are required' },
        { status: 400 }
      );
    }

    // Validate service type against database
    const activeServiceTypes = await getActiveServiceTypes();
    const validServiceTypeIds = activeServiceTypes.map(type => type.id);
    if (!validServiceTypeIds.includes(body.service_type_id)) {
      return NextResponse.json(
        { error: `Invalid service_type_id. Must be one of: ${validServiceTypeIds.join(', ')}` },
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
      service_type_id: body.service_type_id,
      price_range_min: body.price_range_min,
      price_range_max: body.price_range_max,
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      areas: body.areas,
      photos: body.photos || [],
      photoDescriptions: body.photoDescriptions || []
    };

    const service = await createService(serviceData, profileId);
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    logger.error('❌ Service creation failed:', error);
    logger.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}