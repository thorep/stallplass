import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';
import { 
  getBoxAdvertisingPriceObject, 
  getSponsoredPlacementPriceObject, 
  getServiceBasePriceObject,
  createOrUpdateBoxAdvertisingPrice,
  createOrUpdateSponsoredPlacementPrice,
  createOrUpdateServiceBasePrice
} from '@/services/pricing-service';

/**
 * @swagger
 * /api/admin/pricing/base:
 *   get:
 *     summary: Get base pricing configuration (Admin only)
 *     description: Retrieves the base pricing for box advertising, sponsored placements, and service base prices
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Base pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxAdvertising:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                       description: Price for box advertising per month
 *                     currency:
 *                       type: string
 *                       description: Currency code (NOK)
 *                 boxBoost:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                       description: Price for sponsored placement boost per day
 *                     currency:
 *                       type: string
 *                       description: Currency code (NOK)
 *                 serviceBase:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                       description: Base price for service advertising per month
 *                     currency:
 *                       type: string
 *                       description: Currency code (NOK)
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update base pricing configuration (Admin only)
 *     description: Updates the base pricing for all advertising types
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
 *               - boxAdvertising
 *               - boxBoost
 *               - serviceBase
 *             properties:
 *               boxAdvertising:
 *                 type: number
 *                 minimum: 0
 *                 description: Price for box advertising per month
 *               boxBoost:
 *                 type: number
 *                 minimum: 0
 *                 description: Price for sponsored placement boost per day
 *               serviceBase:
 *                 type: number
 *                 minimum: 0
 *                 description: Base price for service advertising per month
 *     responses:
 *       200:
 *         description: Base pricing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxAdvertising:
 *                   type: object
 *                   description: Updated box advertising pricing
 *                 boxBoost:
 *                   type: object
 *                   description: Updated sponsored placement pricing
 *                 serviceBase:
 *                   type: object
 *                   description: Updated service base pricing
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All prices are required and must be positive numbers"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    // Get all three pricing types
    const [boxAdvertising, boxBoost, serviceBase] = await Promise.all([
      getBoxAdvertisingPriceObject(),
      getSponsoredPlacementPriceObject(), 
      getServiceBasePriceObject()
    ]);

    // Create defaults if they don't exist
    const result = {
      boxAdvertising: boxAdvertising || await createOrUpdateBoxAdvertisingPrice(10),
      boxBoost: boxBoost || await createOrUpdateSponsoredPlacementPrice(2),
      serviceBase: serviceBase || await createOrUpdateServiceBasePrice(2)
    };
    
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
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
    const { boxAdvertising, boxBoost, serviceBase } = body;
    
    if (typeof boxAdvertising !== 'number' || boxAdvertising < 0 ||
        typeof boxBoost !== 'number' || boxBoost < 0 ||
        typeof serviceBase !== 'number' || serviceBase < 0) {
      return NextResponse.json(
        { error: 'All prices are required and must be positive numbers' },
        { status: 400 }
      );
    }
    
    // Update all three pricing types
    const [updatedBoxAdvertising, updatedBoxBoost, updatedServiceBase] = await Promise.all([
      createOrUpdateBoxAdvertisingPrice(boxAdvertising),
      createOrUpdateSponsoredPlacementPrice(boxBoost),
      createOrUpdateServiceBasePrice(serviceBase)
    ]);
    
    return NextResponse.json({
      boxAdvertising: updatedBoxAdvertising,
      boxBoost: updatedBoxBoost,
      serviceBase: updatedServiceBase
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}