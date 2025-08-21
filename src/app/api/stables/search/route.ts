import { requireAuth } from '@/lib/auth';
import { searchStablesByName } from '@/services/stable-service';
import { NextRequest, NextResponse } from 'next/server';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/stables/search:
 *   get:
 *     summary: Search stables by name
 *     description: |
 *       Searches for stables by name using case-insensitive partial matching.
 *       Returns active, non-archived stables only with basic information suitable 
 *       for connecting horses to stables. Results are ordered alphabetically by name.
 *     tags: [Stables]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for stable name (case-insensitive partial matching)
 *         example: "Østby"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 15
 *         description: Maximum number of results to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Stables found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Stable ID
 *                   name:
 *                     type: string
 *                     description: Stable name
 *                   address:
 *                     type: string
 *                     nullable: true
 *                     description: Street address
 *                   postalCode:
 *                     type: string
 *                     nullable: true
 *                     description: Postal code
 *                   postalPlace:
 *                     type: string
 *                     nullable: true
 *                     description: Postal place/city
 *                   latitude:
 *                     type: number
 *                     format: float
 *                     description: Latitude coordinate
 *                   longitude:
 *                     type: number
 *                     format: float
 *                     description: Longitude coordinate
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Østby Rideskole"
 *                 address: "Storgata 123"
 *                 postalCode: "0123"
 *                 postalPlace: "Oslo"
 *                 latitude: 59.9139
 *                 longitude: 10.7522
 *               - id: "550e8400-e29b-41d4-a716-446655440001"
 *                 name: "Østlands Hestesenter"
 *                 address: "Landsbygata 45"
 *                 postalCode: "2000"
 *                 postalPlace: "Lillestrøm"
 *                 latitude: 59.9564
 *                 longitude: 11.0464
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missing_query:
 *                 value:
 *                   error: "Search query parameter 'q' is required"
 *               empty_query:
 *                 value:
 *                   error: "Search query cannot be empty"
 *               invalid_limit:
 *                 value:
 *                   error: "Limit must be between 1 and 50"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "Authentication required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "Failed to search stables"
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');

    // Validate required query parameter
    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query cannot be empty" },
        { status: 400 }
      );
    }

    // Validate limit parameter
    let limit = 15; // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return NextResponse.json(
          { error: "Limit must be between 1 and 50" },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Search stables
    const stables = await searchStablesByName(query, limit);

    return NextResponse.json(stables);
  } catch (error) {
    console.error('Error searching stables:', error);
    try { captureApiError({ error, context: 'stables_search_get', route: '/api/stables/search', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to search stables' },
      { status: 500 }
    );
  }
}
