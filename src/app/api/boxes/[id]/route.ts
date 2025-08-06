import { NextRequest, NextResponse } from 'next/server';
import { updateBox, deleteBox, getBoxById } from '@/services/box-service';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/boxes/{id}:
 *   get:
 *     summary: Get a specific box by ID
 *     description: Retrieves detailed information about a box. Public endpoint - no authentication required.
 *     tags: [Boxes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Box ID
 *     responses:
 *       200:
 *         description: Box retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Box not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch box"
 */
// GET route is public - used for viewing box details on /bokser/[id] pages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const box = await getBoxById(params.id);
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(box);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch box' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/boxes/{id}:
 *   put:
 *     summary: Update a specific box (full update)
 *     description: Updates a box with all provided fields. Only the owner of the stable can update boxes.
 *     tags: [Boxes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Box ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Box name
 *               description:
 *                 type: string
 *                 description: Box description
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Monthly price in NOK
 *               size:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *                 description: Box size category
 *               boxType:
 *                 type: string
 *                 description: Type of box
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
 *                 description: Array of image descriptions
 *               amenityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of amenity IDs
 *           example:
 *             name: "Updated Box Name"
 *             description: "Updated description"
 *             price: 4000.00
 *             size: "LARGE"
 *             isAvailable: false
 *             images: ["https://example.com/updated-box.jpg"]
 *             imageDescriptions: ["Updated box view"]
 *     responses:
 *       200:
 *         description: Box updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only update boxes in own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "You can only update boxes in your own stables"
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Box not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    const data = await request.json();
    
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only update boxes in your own stables' },
        { status: 403 }
      );
    }
    
    const updatedBox = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(updatedBox);
  } catch (error) {
    logger.error('Box update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update box' },
      { status: 500 }
    );
  }
});

/**
 * @swagger
 * /api/boxes/{id}:
 *   patch:
 *     summary: Update a specific box (partial update)
 *     description: Updates a box with only the provided fields. Only the owner of the stable can update boxes.
 *     tags: [Boxes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Box ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Box name
 *               description:
 *                 type: string
 *                 description: Box description
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Monthly price in NOK
 *               size:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *                 description: Box size category
 *               boxType:
 *                 type: string
 *                 description: Type of box
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
 *                 description: Array of image descriptions
 *               amenityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of amenity IDs
 *           example:
 *             isAvailable: false
 *             price: 4200.00
 *     responses:
 *       200:
 *         description: Box updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Box'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only update boxes in own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "You can only update boxes in your own stables"
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Box not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    const data = await request.json();
    
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only update boxes in your own stables' },
        { status: 403 }
      );
    }
    
    // For PATCH, we only update the fields provided
    const updatedBox = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(updatedBox);
  } catch (error) {
    logger.error('Box patch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update box' },
      { status: 500 }
    );
  }
});

/**
 * @swagger
 * /api/boxes/{id}:
 *   delete:
 *     summary: Delete a specific box
 *     description: Permanently deletes a box. Only the owner of the stable can delete boxes.
 *     tags: [Boxes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Box ID
 *     responses:
 *       200:
 *         description: Box deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Box deleted successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only delete boxes in own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "You can only delete boxes in your own stables"
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Box not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to delete box"
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only delete boxes in your own stables' },
        { status: 403 }
      );
    }
    
    await deleteBox(params.id);
    
    return NextResponse.json({ message: 'Box deleted successfully' });
  } catch (error) {
    logger.error('Box delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete box' },
      { status: 500 }
    );
  }
});