import { NextResponse } from 'next/server';
import { getAllDiscounts } from '@/services/pricing-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/pricing/discounts:
 *   get:
 *     summary: Get all pricing discounts
 *     description: |
 *       Public endpoint to retrieve all available pricing discounts.
 *       Used by pricing calculators to show potential savings.
 *       Includes duration-based discounts (longer periods = bigger discounts).
 *       No authentication required.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: List of available discounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Discount ID
 *                   name:
 *                     type: string
 *                     description: Human-readable discount name
 *                     example: "3 months discount"
 *                   discountType:
 *                     type: string
 *                     enum: [duration, quantity, bulk]
 *                     description: Type of discount
 *                     example: "duration"
 *                   discountPercentage:
 *                     type: number
 *                     format: float
 *                     description: Discount percentage (e.g., 0.10 for 10% off)
 *                     example: 0.15
 *                   minDuration:
 *                     type: integer
 *                     nullable: true
 *                     description: Minimum duration in months for this discount
 *                     example: 3
 *                   maxDuration:
 *                     type: integer
 *                     nullable: true
 *                     description: Maximum duration in months (null for unlimited)
 *                     example: 5
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440001"
 *                 name: "3 months discount"
 *                 discountType: "duration"
 *                 discountPercentage: 0.10
 *                 minDuration: 3
 *                 maxDuration: 5
 *               - id: "550e8400-e29b-41d4-a716-446655440002"
 *                 name: "6 months discount"
 *                 discountType: "duration"
 *                 discountPercentage: 0.20
 *                 minDuration: 6
 *                 maxDuration: null
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const discounts = await getAllDiscounts();
    return NextResponse.json(discounts);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch pricing discounts' }, 
      { status: 500 }
    );
  }
}