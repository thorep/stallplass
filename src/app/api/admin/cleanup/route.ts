import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { cleanupExpiredContent, getExpiringSponsoredPlacements } from '@/services/cleanup-service';
import { createApiLogger } from '@/lib/logger';
import { captureApiError } from '@/lib/posthog-capture';

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
export async function POST() {
  try {
    // Verify admin access
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

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
    
    try { captureApiError({ error, context: 'admin_cleanup_post', route: '/api/admin/cleanup', method: 'POST' }); } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verify admin access
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    // Since platform is free, only check sponsored placements
    const expiringSponsoredPlacements = await getExpiringSponsoredPlacements(3);

    return NextResponse.json({
      expiringSponsoredPlacements,
      summary: {
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
    
    try { captureApiError({ error, context: 'admin_cleanup_get', route: '/api/admin/cleanup', method: 'GET' }); } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
