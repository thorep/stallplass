import { NextResponse } from 'next/server';
import { getAllBoxQuantityDiscounts } from '@/services/pricing-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/pricing/box-quantity-discounts-public:
 *   get:
 *     summary: Get public box quantity discounts
 *     description: |
 *       Public endpoint to retrieve box quantity discounts for display purposes.
 *       Used by the bulk advertising page to show potential savings to users.
 *       No authentication required.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: List of quantity discounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   minBoxes:
 *                     type: integer
 *                     description: Minimum number of boxes for this discount tier
 *                     example: 5
 *                   maxBoxes:
 *                     type: integer
 *                     nullable: true
 *                     description: Maximum number of boxes for this discount tier (null for unlimited)
 *                     example: 10
 *                   discountPercentage:
 *                     type: number
 *                     format: float
 *                     description: Discount percentage (e.g., 0.10 for 10% off)
 *                     example: 0.15
 *             example:
 *               - minBoxes: 5
 *                 maxBoxes: 9
 *                 discountPercentage: 0.10
 *               - minBoxes: 10
 *                 maxBoxes: null
 *                 discountPercentage: 0.15
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const discounts = await getAllBoxQuantityDiscounts();
    
    // Return just the discount information needed for UI
    return NextResponse.json(
      discounts.map(d => ({
        minBoxes: d.minBoxes,
        maxBoxes: d.maxBoxes,
        discountPercentage: d.discountPercentage
      }))
    );
  } catch (error) {
    logger.error('Public box quantity discounts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box quantity discounts' }, 
      { status: 500 }
    );
  }
}