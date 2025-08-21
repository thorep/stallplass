import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';

/**
 * @swagger
 * /api/locations/kommuner:
 *   get:
 *     summary: Get Norwegian municipalities (kommuner)
 *     description: |
 *       Retrieves a list of Norwegian municipalities (kommuner). Can optionally be 
 *       filtered by county (fylke) ID to get municipalities within a specific county.
 *       No authentication is required as this is public geographic data.
 *     tags:
 *       - Locations
 *       - Public
 *     parameters:
 *       - name: fylke_id
 *         in: query
 *         required: false
 *         description: Filter municipalities by county ID
 *         schema:
 *           type: string
 *           example: "03"
 *         examples:
 *           oslo:
 *             value: "03"
 *             description: Get municipalities in Oslo county
 *           rogaland:
 *             value: "11"
 *             description: Get municipalities in Rogaland county
 *           all:
 *             description: Get all municipalities (no filter)
 *     responses:
 *       200:
 *         description: List of Norwegian municipalities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Municipality ID (kommunenummer)
 *                   name:
 *                     type: string
 *                     description: Municipality name in Norwegian
 *                   code:
 *                     type: string
 *                     description: Official municipality code
 *                   fylkeId:
 *                     type: string
 *                     description: ID of the parent county
 *                   fylkeName:
 *                     type: string
 *                     description: Name of the parent county
 *             example:
 *               - id: "0301"
 *                 name: "Oslo"
 *                 code: "0301"
 *                 fylkeId: "03"
 *                 fylkeName: "Oslo"
 *               - id: "1103"
 *                 name: "Stavanger"
 *                 code: "1103"
 *                 fylkeId: "11"
 *                 fylkeName: "Rogaland"
 *               - id: "1201"
 *                 name: "Bergen"
 *                 code: "1201"
 *                 fylkeId: "46"
 *                 fylkeName: "Vestland"
 *               - id: "5001"
 *                 name: "Trondheim"
 *                 code: "5001"
 *                 fylkeId: "50"
 *                 fylkeName: "Trøndelag"
 *       500:
 *         description: Internal server error - failed to fetch municipalities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch kommuner"
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fylkeId = searchParams.get('fylke_id');

    const kommuner = await locationService.getKommuner(fylkeId || undefined);
    return NextResponse.json(kommuner);
  } catch (error) {
    try { const { captureApiError } = await import('@/lib/posthog-capture'); captureApiError({ error, context: 'locations_kommuner_get', route: '/api/locations/kommuner', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch kommuner' },
      { status: 500 }
    );
  }
}
