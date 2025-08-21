import { NextRequest, NextResponse } from 'next/server';
import { createBoxServer, searchBoxes, type BoxFilters } from '@/services/box-service';
import { prisma } from '@/services/prisma';
import { withApiLogging, logBusinessOperation } from '@/lib/api-middleware';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';
import { BoxType } from '@/generated/prisma';

/**
 * @swagger
 * /api/boxes:
 *   get:
 *     summary: Search and filter boxes
 *     description: |
 *       Search for boxes with various filters. Public endpoint - no authentication required.
 *       Returns empty array on error for graceful degradation.
 *     tags: [Boxes]
 *     parameters:
 *       - in: query
 *         name: stable_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific stable ID
 *       - in: query
 *         name: is_available
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *       - in: query
 *         name: occupancyStatus
 *         schema:
 *           type: string
 *           enum: [all, available, occupied]
 *         description: Filter by occupancy status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum price filter (in NOK)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum price filter (in NOK)
 *       - in: query
 *         name: max_horse_size
 *         schema:
 *           type: string
 *         description: Maximum horse size filter
 *       - in: query
 *         name: fylkeId
 *         schema:
 *           type: string
 *         description: Filter by fylke (county) ID
 *       - in: query
 *         name: kommuneId
 *         schema:
 *           type: string
 *         description: Filter by kommune (municipality) ID
 *       - in: query
 *         name: amenityIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenity IDs to filter by
 *         example: "amenity1,amenity2,amenity3"
 *     responses:
 *       200:
 *         description: Boxes retrieved successfully (always returns array, even if empty)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Box'
 */
async function getBoxes(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse search/filter parameters
  const filters: BoxFilters = {};
  
  if (searchParams.get('stable_id')) {
    filters.stableId = searchParams.get('stable_id')!;
  }
  
  if (searchParams.get('is_available')) {
    // Map old is_available parameter to new availableQuantity logic
    const isAvailable = searchParams.get('is_available') === 'true';
    filters.occupancyStatus = isAvailable ? 'available' : 'occupied';
  }
  
  if (searchParams.get('occupancyStatus')) {
    const status = searchParams.get('occupancyStatus')!;
    if (['all', 'available', 'occupied'].includes(status)) {
      filters.occupancyStatus = status as 'all' | 'available' | 'occupied';
    }
  }
  
  if (searchParams.get('minPrice')) {
    filters.minPrice = parseInt(searchParams.get('minPrice')!);
  }
  
  if (searchParams.get('maxPrice')) {
    filters.maxPrice = parseInt(searchParams.get('maxPrice')!);
  }
  
  // Note: isIndoor, hasWindow, hasElectricity, hasWater fields removed from schema
  // These should now be handled via box_amenities relation
  
  if (searchParams.get('max_horse_size')) {
    filters.maxHorseSize = searchParams.get('max_horse_size')!;
  }
  
  if (searchParams.get('fylkeId')) {
    filters.fylkeId = searchParams.get('fylkeId')!;
  }
  
  if (searchParams.get('kommuneId')) {
    filters.kommuneId = searchParams.get('kommuneId')!;
  }
  
  if (searchParams.get('amenityIds')) {
    filters.amenityIds = searchParams.get('amenityIds')!.split(',');
  }

  try {

    // Use the search service which includes occupancy filtering
    logger.info({ filters }, 'Searching boxes with filters');
    const boxes = await searchBoxes(filters);

    logger.info({ 
      boxCount: boxes?.length || 0,
      filtersApplied: Object.keys(filters).length
    }, `Box search completed: ${boxes?.length || 0} results`);

    // Always return an array, even if empty
    return NextResponse.json(boxes || []);
  } catch (error) {
    logger.error({ error, filters }, 'Error searching boxes');
    try { captureApiError({ error, context: 'boxes_search_get', route: '/api/boxes', method: 'GET', ...filters }); } catch {}
    // Return empty array for graceful degradation instead of error
    // This allows the frontend to handle empty state properly
    return NextResponse.json([]);
  }
}

/**
 * @swagger
 * /api/boxes:
 *   post:
 *     summary: Create a new box
 *     description: Creates a new box for a stable. Only the stable owner can create boxes for their stable.
 *     tags: [Boxes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stableId]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Box name (required)
 *               description:
 *                 type: string
 *                 description: Box description
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Monthly price in NOK (required)
 *               size:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *                 description: Box size category
 *               sizeText:
 *                 type: string
 *                 description: Detailed size description
 *               stableId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the stable this box belongs to (required)
 *               maxHorseSize:
 *                 type: string
 *                 description: Maximum horse size (e.g., "Pony", "Small", "Medium", "Large")
 *               specialNotes:
 *                 type: string
 *                 description: Special notes or requirements
 *               boxType:
 *                 type: string
 *                 description: Type of box (BoxType enum)
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the box is available for rent
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of image URLs
 *               imageDescriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image descriptions (corresponding to images)
 *               amenityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of amenity IDs for this box
 *               dagsleie:
 *                 type: boolean
 *                 description: Whether this box is available for daily rental
 *           example:
 *             name: "Box 12"
 *             description: "Stor boks med gode fasiliteter"
 *             price: 3500.00
 *             size: "LARGE"
 *             sizeText: "3.5x3.5m, innvendige mål 12m²"
 *             stableId: "stable-uuid-123"
 *             boxType: "STANDARD"
 *             isAvailable: true
 *             maxHorseSize: "Large"
 *             specialNotes: "Må reserveres på forhånd"
 *             images: ["https://example.com/box12.jpg"]
 *             imageDescriptions: ["Main view of box 12"]
 *             amenityIds: ["amenity-1", "amenity-2"]
 *             dagsleie: false
 *     responses:
 *       201:
 *         description: Box created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_required_fields:
 *                 value:
 *                   error: "Name, price, and stableId are required"
 *               missing_body:
 *                 value:
 *                   error: "Request body is required"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only create boxes for own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "You can only create boxes for your own stables"
 *       404:
 *         description: Stable not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Stable not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to create box"
 */
async function createBox(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  const profileId = user.id;
  const startTime = Date.now();
  let data: Record<string, unknown> | undefined;
  try {
    data = await request.json();
    if (!data) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }
    
    logger.info({ boxData: data, userId: profileId }, 'Creating new box');
    
    // Map to Prisma schema format (camelCase)
    const boxData = {
      name: data.name as string,
      description: data.description as string,
      price: data.price as number,
      size: data.size as 'SMALL' | 'MEDIUM' | 'LARGE' | undefined,
      sizeText: data.sizeText as string | undefined,
      stableId: (data.stableId || data.stable_id) as string,
      boxType: (data.boxType || data.box_type) as BoxType,
      availableQuantity: data.availableQuantity !== undefined ? data.availableQuantity as number : 1,
      maxHorseSize: data.maxHorseSize as string | undefined,
      specialNotes: data.specialNotes as string | undefined,
      dagsleie: data.dagsleie !== undefined ? data.dagsleie as boolean : false,
      images: (data.images || []) as string[],
      imageDescriptions: (data.imageDescriptions || data.image_descriptions || []) as string[],
      updatedAt: new Date(),
      amenityIds: data.amenityIds as string[]
      // Note: isIndoor, hasWindow, hasElectricity, hasWater removed - use amenities instead
    };
    
    // Validate required fields
    if (!boxData.name || !boxData.price || !boxData.stableId) {
      return NextResponse.json(
        { error: 'Name, price, and stableId are required' },
        { status: 400 }
      );
    }

    // Check if stable exists AND user owns it
    const stable = await prisma.stables.findUnique({
      where: { id: boxData.stableId },
      select: { id: true, ownerId: true }
    });
    
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (stable.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only create boxes for your own stables' },
        { status: 403 }
      );
    }

    const box = await createBoxServer(boxData);
    const duration = Date.now() - startTime;
    
    logBusinessOperation('create_box', 'success', {
      resourceId: box.id,
      resourceType: 'box',
      duration,
      details: { 
        name: box.name, 
        stableId: box.stableId,
        price: box.price 
      }
    });
    
    logger.info({ 
      boxId: box.id, 
      stableId: box.stableId,
      duration 
    }, 'Box created successfully');
    
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logBusinessOperation('create_box', 'failure', {
      duration,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(data && { stableId: data.stableId || data.stable_id })
      }
    });
    
    logger.error({ 
      error,
      ...(data && { boxData: data }),
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }, 'Failed to create box');
    try { captureApiError({ error, context: 'box_create_post', route: '/api/boxes', method: 'POST', stableId: data && (data.stableId || data.stable_id) }); } catch {}
    
    return NextResponse.json(
      { error: 'Failed to create box' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(getBoxes);
export const POST = createBox;
