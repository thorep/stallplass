import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getStableStats } from '@/services/admin-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/stats/stables:
 *   get:
 *     summary: Get stable statistics (Admin only)
 *     description: Retrieves comprehensive statistics about stables including counts by status, geographical distribution, and activity metrics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stable statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStables:
 *                   type: number
 *                   description: Total number of stables
 *                 activeStables:
 *                   type: number
 *                   description: Number of active (published) stables
 *                 archivedStables:
 *                   type: number
 *                   description: Number of archived stables
 *                 advertisedStables:
 *                   type: number
 *                   description: Number of stables with active advertising
 *                 stablesWithBoxes:
 *                   type: number
 *                   description: Number of stables that have boxes
 *                 recentStables:
 *                   type: number
 *                   description: Number of stables created in the last 30 days
 *                 averageBoxesPerStable:
 *                   type: number
 *                   description: Average number of boxes per stable
 *                 geographicalDistribution:
 *                   type: object
 *                   description: Distribution of stables by county/region
 *                   additionalProperties:
 *                     type: number
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Admin access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch stable statistics"
 */
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;
    
    const stats = await getStableStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching stable statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stable statistics' },
      { status: 500 }
    );
  }
}