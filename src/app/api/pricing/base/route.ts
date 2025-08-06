import { NextResponse } from 'next/server';
import { getBoxAdvertisingPriceObject } from '@/services/pricing-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/pricing/base:
 *   get:
 *     summary: Get base advertising price for boxes
 *     description: |
 *       Public endpoint to retrieve the base price for box advertising.
 *       Used by pricing calculators and display components.
 *       No authentication required.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: Base advertising price object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Price object ID
 *                 advertisingType:
 *                   type: string
 *                   enum: [box, service]
 *                   description: Type of advertising this price applies to
 *                   example: "box"
 *                 price:
 *                   type: number
 *                   format: float
 *                   description: Base price in NOK per month
 *                   example: 299.00
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: Description of what this price includes
 *                   example: "Monthly advertising for box listings"
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440000"
 *               advertisingType: "box"
 *               price: 299.00
 *               description: "Monthly advertising for box listings"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    const boxAdvertisingPrice = await getBoxAdvertisingPriceObject();
    return NextResponse.json(boxAdvertisingPrice);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch box advertising price' }, 
      { status: 500 }
    );
  }
}