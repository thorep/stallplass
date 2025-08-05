import { NextRequest, NextResponse } from 'next/server';
import { getBoxesByStableId } from '@/services/box-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/stables/{id}/boxes:
 *   get:
 *     summary: Get all boxes for a specific stable
 *     description: Retrieves all boxes belonging to a stable. Public endpoint - no authentication required.
 *     tags: [Stables, Boxes]
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
 *         description: Boxes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Box'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch boxes"
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const boxes = await getBoxesByStableId(params.id);
    
    return NextResponse.json(boxes);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch boxes' },
      { status: 500 }
    );
  }
}