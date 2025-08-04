import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllBoxQuantityDiscounts
} from '@/services/pricing-service';
import { prisma } from '@/services/prisma';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * GET /api/admin/pricing/box-quantity-discounts
 * Get all box quantity discounts (admin only)
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

/**
 * POST /api/admin/pricing/box-quantity-discounts
 * Create a new box quantity discount (admin only)
 */
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

/**
 * PUT /api/admin/pricing/box-quantity-discounts
 * Update a box quantity discount (admin only)
 */
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

/**
 * DELETE /api/admin/pricing/box-quantity-discounts?id=xxx
 * Delete a box quantity discount (admin only)
 */
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