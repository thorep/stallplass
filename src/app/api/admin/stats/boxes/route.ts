import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { getBoxStats } from '@/services/admin-service';
import { logger } from '@/lib/logger';

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
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request);
    
    const stats = await getBoxStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching box statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box statistics' },
      { status: 500 }
    );
  }
}