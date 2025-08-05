import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllBoxQuantityDiscounts
} from '@/services/pricing-service';
import { prisma } from '@/services/prisma';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/pricing/box-quantity-discounts:
 *   get:
 *     summary: Get all box quantity discounts (Admin only)
 *     description: Retrieves all box quantity-based discounts that apply when advertising multiple boxes
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Box quantity discounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Discount ID
 *                   minBoxes:
 *                     type: number
 *                     description: Minimum number of boxes required
 *                   maxBoxes:
 *                     type: number
 *                     nullable: true
 *                     description: Maximum number of boxes (null for unlimited)
 *                   discountPercentage:
 *                     type: number
 *                     description: Discount percentage applied
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the discount is active
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new box quantity discount (Admin only)
 *     description: Creates a new discount that applies when advertising multiple boxes
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - minBoxes
 *               - discountPercentage
 *             properties:
 *               minBoxes:
 *                 type: number
 *                 minimum: 1
 *                 description: Minimum number of boxes required for discount
 *               maxBoxes:
 *                 type: number
 *                 nullable: true
 *                 description: Maximum number of boxes (null for unlimited)
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage to apply
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the discount is active
 *     responses:
 *       200:
 *         description: Box quantity discount created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 minBoxes:
 *                   type: number
 *                 maxBoxes:
 *                   type: number
 *                   nullable: true
 *                 discountPercentage:
 *                   type: number
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "minBoxes is required and must be positive"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a box quantity discount (Admin only)
 *     description: Updates an existing box quantity discount
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Discount ID to update
 *               minBoxes:
 *                 type: number
 *                 minimum: 1
 *                 description: Minimum number of boxes required
 *               maxBoxes:
 *                 type: number
 *                 nullable: true
 *                 description: Maximum number of boxes (null for unlimited)
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage to apply
 *               isActive:
 *                 type: boolean
 *                 description: Whether the discount is active
 *     responses:
 *       200:
 *         description: Box quantity discount updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a box quantity discount (Admin only)
 *     description: Deletes an existing box quantity discount
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount ID to delete
 *     responses:
 *       200:
 *         description: Box quantity discount deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required ID parameter
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Discount not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return unauthorizedResponse();
    }

    const discounts = await getAllBoxQuantityDiscounts();
    return NextResponse.json(discounts);
  } catch (error) {
    logger.error('Box quantity discounts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box quantity discounts' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { minBoxes, maxBoxes, discountPercentage, isActive = true } = body;

    if (!minBoxes || minBoxes < 1) {
      return NextResponse.json(
        { error: 'minBoxes is required and must be positive' },
        { status: 400 }
      );
    }

    if (!discountPercentage || discountPercentage <= 0 || discountPercentage >= 100) {
      return NextResponse.json(
        { error: 'discountPercentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxBoxes !== null && maxBoxes <= minBoxes) {
      return NextResponse.json(
        { error: 'maxBoxes must be greater than minBoxes or null' },
        { status: 400 }
      );
    }

    const newDiscount = await prisma.box_quantity_discounts.create({
      data: {
        minBoxes,
        maxBoxes,
        discountPercentage,
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(newDiscount);
  } catch (error) {
    logger.error('Box quantity discount creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create box quantity discount' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { id, minBoxes, maxBoxes, discountPercentage, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (minBoxes !== undefined && (minBoxes < 1)) {
      return NextResponse.json(
        { error: 'minBoxes must be positive' },
        { status: 400 }
      );
    }

    if (discountPercentage !== undefined && (discountPercentage <= 0 || discountPercentage >= 100)) {
      return NextResponse.json(
        { error: 'discountPercentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxBoxes !== null && minBoxes && maxBoxes <= minBoxes) {
      return NextResponse.json(
        { error: 'maxBoxes must be greater than minBoxes or null' },
        { status: 400 }
      );
    }

    const updateData: {
      updatedAt: Date;
      minBoxes?: number;
      maxBoxes?: number | null;
      discountPercentage?: number;
      isActive?: boolean;
    } = { updatedAt: new Date() };
    if (minBoxes !== undefined) updateData.minBoxes = minBoxes;
    if (maxBoxes !== undefined) updateData.maxBoxes = maxBoxes;
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDiscount = await prisma.box_quantity_discounts.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    logger.error('Box quantity discount update error:', error);
    return NextResponse.json(
      { error: 'Failed to update box quantity discount' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    await prisma.box_quantity_discounts.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Box quantity discount deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete box quantity discount' }, 
      { status: 500 }
    );
  }
}