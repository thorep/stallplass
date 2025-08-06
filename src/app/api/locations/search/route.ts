import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/locations/search:
 *   get:
 *     summary: Search Norwegian locations
 *     description: |
 *       Searches for Norwegian geographic locations (counties and municipalities) 
 *       by name. Provides a unified search across both fylker and kommuner.
 *       No authentication is required as this is public geographic data.
 *     tags:
 *       - Locations
 *       - Public
 *       - Search
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query for location names
 *         schema:
 *           type: string
 *           minLength: 1
 *         examples:
 *           city:
 *             value: "Oslo"
 *             description: Search for Oslo
 *           partial:
 *             value: "Ber"
 *             description: Search for locations starting with "Ber" (e.g., Bergen)
 *           county:
 *             value: "Rogaland"
 *             description: Search for Rogaland county
 *     responses:
 *       200:
 *         description: Search results with matching locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Location ID
 *                   name:
 *                     type: string
 *                     description: Location name
 *                   type:
 *                     type: string
 *                     enum: [fylke, kommune]
 *                     description: Type of location (county or municipality)
 *                   code:
 *                     type: string
 *                     description: Official location code
 *                   parentId:
 *                     type: string
 *                     nullable: true
 *                     description: Parent county ID (for municipalities)
 *                   parentName:
 *                     type: string
 *                     nullable: true
 *                     description: Parent county name (for municipalities)
 *             example:
 *               - id: "0301"
 *                 name: "Oslo"
 *                 type: "kommune"
 *                 code: "0301"
 *                 parentId: "03"
 *                 parentName: "Oslo"
 *               - id: "03"
 *                 name: "Oslo"
 *                 type: "fylke"
 *                 code: "03"
 *                 parentId: null
 *                 parentName: null
 *               - id: "1201"
 *                 name: "Bergen"
 *                 type: "kommune"
 *                 code: "1201"
 *                 parentId: "46"
 *                 parentName: "Vestland"
 *       400:
 *         description: Bad request - missing search query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Search query is required"
 *       500:
 *         description: Internal server error - search failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to search locations"
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await locationService.searchLocations(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}