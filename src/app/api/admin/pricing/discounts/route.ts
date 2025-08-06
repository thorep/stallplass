import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getAllDiscounts, getAllBoostDiscounts } from '@/services/pricing-service';
import { getServicePricingDiscounts } from '@/services/service-pricing-service';
import { createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/pricing/discounts:
 *   get:
 *     summary: Get all pricing discounts (Admin only)
 *     description: Retrieves all types of pricing discounts (box advertising, boost, and service pricing discounts)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Discounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxDiscounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       months:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                 boostDiscounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       days:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                 serviceDiscounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       months:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new pricing discount (Admin only)
 *     description: Creates a new discount for box advertising, boost, or service pricing
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
 *               - type
 *               - percentage
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [box, boost, service]
 *                 description: Type of discount to create
 *               months:
 *                 type: number
 *                 minimum: 1
 *                 description: Duration in months (required for box and service discounts)
 *               days:
 *                 type: number
 *                 minimum: 1
 *                 description: Duration in days (required for boost discounts)
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the discount is active
 *     responses:
 *       200:
 *         description: Discount created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a pricing discount (Admin only)
 *     description: Updates an existing discount
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
 *               - type
 *             properties:
 *               id:
 *                 type: string
 *                 description: Discount ID to update
 *               type:
 *                 type: string
 *                 enum: [box, boost, service]
 *                 description: Type of discount
 *               months:
 *                 type: number
 *                 minimum: 1
 *                 description: Duration in months (for box and service discounts)
 *               days:
 *                 type: number
 *                 minimum: 1
 *                 description: Duration in days (for boost discounts)
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage
 *               isActive:
 *                 type: boolean
 *                 description: Whether the discount is active
 *     responses:
 *       200:
 *         description: Discount updated successfully
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
 *     summary: Delete a pricing discount (Admin only)
 *     description: Deletes an existing discount
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
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [box, boost, service]
 *         description: Type of discount to delete
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required parameters
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
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    // Get all discount types: box advertising, boost, and service pricing discounts
    const [boxDiscounts, boostDiscounts, serviceDiscounts] = await Promise.all([
      getAllDiscounts(),
      getAllBoostDiscounts(),
      getServicePricingDiscounts()
    ]);

    return NextResponse.json({
      boxDiscounts,
      boostDiscounts,
      serviceDiscounts
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/pricing/discounts',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to fetch discounts');
    
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
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
    const { type, months, days, percentage, isActive } = body;
    
    if (type === 'service') {
      // Create service pricing discount
      const { prisma } = await import('@/services/prisma');
      const discount = await prisma.service_pricing_discounts.create({
        data: {
          months: months,
          percentage: percentage,
          isActive: isActive ?? true,
        }
      });
      return NextResponse.json(discount);
    } else if (type === 'boost') {
      // Create boost pricing discount
      const { createBoostDiscount } = await import('@/services/pricing-service');
      const discount = await createBoostDiscount({
        days: days,
        percentage: percentage,
        isActive: isActive ?? true,
      });
      return NextResponse.json(discount);
    } else {
      // Create box advertising discount
      const { createDiscount } = await import('@/services/pricing-service');
      const discount = await createDiscount({
        months: months,
        percentage: percentage
      });
      return NextResponse.json(discount);
    }
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/pricing/discounts',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to create discount');
    
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, type, months, days, percentage, isActive } = body;
    
    if (type === 'service') {
      // Update service pricing discount
      const { prisma } = await import('@/services/prisma');
      const discount = await prisma.service_pricing_discounts.update({
        where: { id },
        data: {
          months: months,
          percentage: percentage,
          isActive: isActive,
        }
      });
      return NextResponse.json(discount);
    } else if (type === 'boost') {
      // Update boost pricing discount
      const { updateBoostDiscount } = await import('@/services/pricing-service');
      const discount = await updateBoostDiscount(id, {
        days: days,
        percentage: percentage,
        isActive: isActive,
      });
      return NextResponse.json(discount);
    } else {
      // Update box advertising discount
      const { updateDiscount } = await import('@/services/pricing-service');
      const discount = await updateDiscount(id, {
        months: months,
        percentage: percentage,
        isActive: isActive
      });
      return NextResponse.json(discount);
    }
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/pricing/discounts',
      method: 'PUT',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to update discount');
    
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const { prisma } = await import('@/services/prisma');
    
    if (type === 'service') {
      // Delete service pricing discount
      await prisma.service_pricing_discounts.delete({
        where: { id }
      });
    } else if (type === 'boost') {
      // Delete boost pricing discount
      await prisma.boost_pricing_discounts.delete({
        where: { id }
      });
    } else {
      // Delete box advertising discount
      await prisma.pricing_discounts.delete({
        where: { id }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/pricing/discounts',
      method: 'DELETE',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to delete discount');
    
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}