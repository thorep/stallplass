import { NextRequest, NextResponse } from 'next/server';
import { getStableById, updateStable, deleteStable } from '@/services/stable-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';

/**
 * @swagger
 * /api/stables/{id}:
 *   get:
 *     summary: Get a specific stable by ID
 *     description: Retrieves detailed information about a stable. Public endpoint - no authentication required.
 *     tags: [Stables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stable ID
 *     responses:
 *       200:
 *         description: Stable retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
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
 *               error: "Failed to fetch stable"
 */
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

/**
 * @swagger
 * /api/stables/{id}:
 *   put:
 *     summary: Update a specific stable
 *     description: Updates a stable. Only the stable owner can update their stable. All fields are optional.
 *     tags: [Stables]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stable ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Stable name
 *               description:
 *                 type: string
 *                 description: Stable description
 *               address:
 *                 type: string
 *                 description: Street address
 *               postalCode:
 *                 type: string
 *                 description: Postal code
 *               poststed:
 *                 type: string
 *                 description: Postal area (alternative to city)
 *               city:
 *                 type: string
 *                 description: City name (alternative to poststed)
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     format: float
 *                     minimum: -90
 *                     maximum: 90
 *                     description: Latitude
 *                   lon:
 *                     type: number
 *                     format: float
 *                     minimum: -180
 *                     maximum: 180
 *                     description: Longitude
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
 *                 description: Array of image descriptions
 *               amenityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of amenity IDs
 *           example:
 *             name: "Updated Stable Name"
 *             description: "Updated description"
 *             address: "New Address 456"
 *             postalCode: "0456"
 *             poststed: "Oslo"
 *             coordinates:
 *               lat: 59.9200
 *               lon: 10.7600
 *             images: ["https://example.com/new-image.jpg"]
 *             imageDescriptions: ["Updated stable view"]
 *             amenityIds: ["amenity-1", "amenity-2"]
 *     responses:
 *       200:
 *         description: Stable updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authentication required"
 *       403:
 *         description: Forbidden - Can only update own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized - you can only update your own stables"
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
 *               error: "Failed to update stable"
 */
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
      // Add location fields like in create API
      postnummer?: string;
      poststed?: string;
      kommuneNumber?: string;
      county?: string;
      municipality?: string;
    } = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.postalCode !== undefined) {
      updateData.postalCode = body.postalCode;
      updateData.postnummer = body.postalCode; // Service expects 'postnummer'
    }
    if (body.poststed !== undefined || body.city !== undefined) {
      updateData.postalPlace = body.poststed || body.city;
      updateData.poststed = body.poststed || body.city; // Service expects 'poststed'
    }
    // Add location mapping like in create API
    if (body.kommuneNumber !== undefined) updateData.kommuneNumber = body.kommuneNumber;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.municipality !== undefined) updateData.municipality = body.municipality;
    
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

/**
 * @swagger
 * /api/stables/{id}:
 *   delete:
 *     summary: Delete a specific stable
 *     description: Permanently deletes a stable. Only the stable owner can delete their stable.
 *     tags: [Stables]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stable ID
 *     responses:
 *       200:
 *         description: Stable deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stable deleted successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authentication required"
 *       403:
 *         description: Forbidden - Can only delete own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized - you can only delete your own stables"
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
 *               error: "Failed to delete stable"
 */
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