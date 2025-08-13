import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

/**
 * @swagger
 * /api/admin/check:
 *   get:
 *     summary: Verify admin access (Admin only)
 *     description: Simple endpoint to verify that the current user has admin access. Returns success if admin, otherwise returns 403.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User has admin access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   example: true
 *                   description: Confirms the user has admin privileges
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User does not have admin access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Admin access required"
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  
  return NextResponse.json({ isAdmin: true });
}