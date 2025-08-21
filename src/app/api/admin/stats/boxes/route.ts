import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getBoxStats } from '@/services/admin-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';

/**
 * @swagger
 * /api/admin/stats/boxes:
 *   get:
 *     summary: Get box statistics (Admin only)
 *     description: Retrieves comprehensive statistics about all boxes in the system including counts by status, pricing information, and trends
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Box statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBoxes:
 *                   type: number
 *                   description: Total number of boxes
 *                 activeBoxes:
 *                   type: number
 *                   description: Number of active (published) boxes
 *                 archivedBoxes:
 *                   type: number
 *                   description: Number of archived boxes
 *                 advertisedBoxes:
 *                   type: number
 *                   description: Number of boxes with active advertising
 *                 averagePrice:
 *                   type: number
 *                   description: Average box price
 *                 recentBoxes:
 *                   type: number
 *                   description: Number of boxes created in the last 30 days
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
 *                   example: "Failed to fetch box statistics"
 */
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;
    
    const stats = await getBoxStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching box statistics:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'admin_stats_boxes_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch box statistics' },
      { status: 500 }
    );
  }
}
