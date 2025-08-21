import { NextResponse } from 'next/server';
import { getActiveHorseDisciplines } from '@/services/horse-discipline-service';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/horse-disciplines:
 *   get:
 *     summary: Get all active horse disciplines
 *     description: Retrieves all active horse disciplines for public use (forms, filters, etc.)
 *     tags: [Horse Disciplines]
 *     responses:
 *       200:
 *         description: Active horse disciplines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Horse discipline ID
 *                       name:
 *                         type: string
 *                         description: Horse discipline name
 *                       isActive:
 *                         type: boolean
 *                         description: Whether the discipline is active
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Failed to fetch horse disciplines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch horse disciplines"
 */
export async function GET() {
  try {
    const disciplines = await getActiveHorseDisciplines();
    return NextResponse.json({ data: disciplines });
  } catch (error) {
    console.error('Error fetching horse disciplines:', error);
    try { captureApiError({ error, context: 'horse_disciplines_get', route: '/api/horse-disciplines', method: 'GET' }); } catch {}
    return NextResponse.json({ error: 'Failed to fetch horse disciplines' }, { status: 500 });
  }
}
