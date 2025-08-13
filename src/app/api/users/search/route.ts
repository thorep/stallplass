import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchUsersByNickname } from '@/services/profile-service';
import { z } from 'zod';

// Validation schema for search query
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query must be at least 1 character').max(100, 'Search query too long'),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(20)).optional()
});

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users by nickname
 *     description: |
 *       Search for users by nickname with partial matching. 
 *       Excludes the current authenticated user from results.
 *       Used for sharing horses with other users.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for nickname (case-insensitive partial match)
 *         example: "ole"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 15
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Users found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: User ID
 *                       nickname:
 *                         type: string
 *                         description: User's display nickname
 *                       firstname:
 *                         type: string
 *                         nullable: true
 *                         description: User's first name
 *                       lastname:
 *                         type: string
 *                         nullable: true
 *                         description: User's last name
 *             example:
 *               users:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   nickname: "OleH"
 *                   firstname: "Ole"
 *                   lastname: "Hansen"
 *                 - id: "123e4567-e89b-12d3-a456-426614174001"
 *                   nickname: "OleMarie"
 *                   firstname: "Ole Marie"
 *                   lastname: "Olsen"
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Search query must be at least 1 character"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to search users"
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = searchQuerySchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit')
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { q: query, limit = 15 } = validationResult.data;

    // Search for users by nickname
    const users = await searchUsersByNickname(query, user.id, limit);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}