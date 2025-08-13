import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getProfileStats } from '@/services/admin-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/stats/profiles:
 *   get:
 *     summary: Get profile statistics (Admin only)
 *     description: Retrieves comprehensive statistics about user profiles and registrations in the system
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProfiles:
 *                   type: number
 *                   description: Total number of user profiles
 *                 activeProfiles:
 *                   type: number
 *                   description: Number of active user profiles
 *                 profilesWithStables:
 *                   type: number
 *                   description: Number of profiles that own stables
 *                 profilesWithServices:
 *                   type: number
 *                   description: Number of profiles that offer services
 *                 recentRegistrations:
 *                   type: number
 *                   description: Number of profiles created in the last 30 days
 *                 profilesWithCompleteInfo:
 *                   type: number
 *                   description: Number of profiles with complete profile information
 *                 averageStablesPerProfile:
 *                   type: number
 *                   description: Average number of stables per profile
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
 *                   example: "Failed to fetch profile statistics"
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const stats = await getProfileStats();
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Failed to fetch profile stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile statistics' },
      { status: 500 }
    );
  }
}