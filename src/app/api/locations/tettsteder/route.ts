import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/locations/tettsteder:
 *   get:
 *     summary: Get Norwegian urban settlements (tettsteder)
 *     description: |
 *       Retrieves a list of Norwegian urban settlements (tettsteder). 
 *       **Note**: This functionality is not yet implemented and currently returns 
 *       an empty array. This endpoint is reserved for future implementation.
 *     tags:
 *       - Locations
 *       - Public
 *     responses:
 *       200:
 *         description: Empty list (functionality not implemented)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example: []
 *       501:
 *         description: Not implemented - tettsteder functionality not available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "tettsteder not implemented"
 */

// Note: tettsteder (urban settlements) are not implemented in the current schema
// This endpoint returns an empty array for now
export async function GET() {
  try {
    // tettsteder functionality not implemented - return empty array
    return NextResponse.json([]);
  } catch (error) {
    try { const { getPostHogServer } = await import('@/lib/posthog-server'); const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'locations_tettsteder' }); } catch {}
    return NextResponse.json(
      { error: 'tettsteder not implemented' },
      { status: 501 }
    );
  }
}
