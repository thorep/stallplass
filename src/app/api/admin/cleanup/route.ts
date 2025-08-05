import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { cleanupExpiredContent, getExpiringBoxes, getExpiringServices, getExpiringSponsoredPlacements } from '@/services/cleanup-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/cleanup:
 *   post:
 *     summary: Manually trigger expired content cleanup (Admin only)
 *     description: Manually triggers the cleanup process for expired boxes, services, and sponsored placements
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Manual cleanup completed successfully"
 *                 results:
 *                   type: object
 *                   properties:
 *                     expiredBoxes:
 *                       type: number
 *                       description: Number of boxes that were archived due to expiration
 *                     expiredServices:
 *                       type: number
 *                       description: Number of services that were archived due to expiration
 *                     expiredSponsoredPlacements:
 *                       type: number
 *                       description: Number of sponsored placements that were deactivated
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get expiring content preview (Admin only)
 *     description: Gets a preview of content that will expire soon without actually cleaning it up
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Expiring content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expiringBoxes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       advertisingExpiresAt:
 *                         type: string
 *                         format: date-time
 *                   description: Boxes expiring within 7 days
 *                 expiringServices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       advertisingExpiresAt:
 *                         type: string
 *                         format: date-time
 *                   description: Services expiring within 7 days
 *                 expiringSponsoredPlacements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                   description: Sponsored placements expiring within 3 days
 *                 summary:
 *                   type: object
 *                   properties:
 *                     boxesExpiring7Days:
 *                       type: number
 *                       description: Count of boxes expiring in 7 days
 *                     servicesExpiring7Days:
 *                       type: number
 *                       description: Count of services expiring in 7 days
 *                     sponsoredExpiring3Days:
 *                       type: number
 *                       description: Count of sponsored placements expiring in 3 days
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const results = await cleanupExpiredContent();

    return NextResponse.json({
      success: true,
      message: 'Manual cleanup completed successfully',
      results
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Admin cleanup failed');
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const expiringBoxes = await getExpiringBoxes(7);
    const expiringServices = await getExpiringServices(7);
    const expiringSponsoredPlacements = await getExpiringSponsoredPlacements(3);

    return NextResponse.json({
      expiringBoxes,
      expiringServices,
      expiringSponsoredPlacements,
      summary: {
        boxesExpiring7Days: expiringBoxes.length,
        servicesExpiring7Days: expiringServices.length,
        sponsoredExpiring3Days: expiringSponsoredPlacements.length
      }
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to get expiring content');
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}