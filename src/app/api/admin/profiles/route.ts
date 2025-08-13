import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminProfilesWithCounts } from '@/services/admin-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/profiles:
 *   get:
 *     summary: Get all user profiles with counts (Admin only)
 *     description: Retrieves all user profiles with additional statistics including number of stables, boxes, and services owned
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Profile ID
 *                   firstname:
 *                     type: string
 *                     nullable: true
 *                     description: User's first name
 *                   middlename:
 *                     type: string
 *                     nullable: true
 *                     description: User's middle name
 *                   lastname:
 *                     type: string
 *                     nullable: true
 *                     description: User's last name
 *                   nickname:
 *                     type: string
 *                     nullable: true
 *                     description: User's nickname/display name
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                     description: User's phone number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Profile creation date
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Profile last update date
 *                   _count:
 *                     type: object
 *                     properties:
 *                       stables:
 *                         type: number
 *                         description: Number of stables owned by user
 *                       boxes:
 *                         type: number
 *                         description: Number of boxes owned by user
 *                       services:
 *                         type: number
 *                         description: Number of services offered by user
 *                       conversations:
 *                         type: number
 *                         description: Number of conversations initiated by user
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
 *                   example: "Failed to fetch profiles"
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const profiles = await getAdminProfilesWithCounts();
    return NextResponse.json(profiles);
  } catch (error) {
    logger.error('Failed to fetch admin profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}