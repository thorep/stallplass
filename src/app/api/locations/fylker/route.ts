import { NextResponse } from 'next/server';
import { locationService } from '@/services/location-service';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/locations/fylker:
 *   get:
 *     summary: Get all Norwegian counties (fylker)
 *     description: |
 *       Retrieves a list of all Norwegian counties (fylker). This endpoint provides
 *       the administrative divisions of Norway for location-based filtering and search.
 *       No authentication is required as this is public geographic data.
 *     tags:
 *       - Locations
 *       - Public
 *     responses:
 *       200:
 *         description: List of Norwegian counties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: County ID (fylkesnummer)
 *                   name:
 *                     type: string
 *                     description: County name in Norwegian
 *                   code:
 *                     type: string
 *                     description: Official county code
 *             example:
 *               - id: "03"
 *                 name: "Oslo"
 *                 code: "03"
 *               - id: "11"
 *                 name: "Rogaland"
 *                 code: "11"
 *               - id: "15"
 *                 name: "Møre og Romsdal"
 *                 code: "15"
 *               - id: "18"
 *                 name: "Nordland"
 *                 code: "18"
 *               - id: "30"
 *                 name: "Viken"
 *                 code: "30"
 *               - id: "34"
 *                 name: "Innlandet"
 *                 code: "34"
 *               - id: "38"
 *                 name: "Vestfold og Telemark"
 *                 code: "38"
 *               - id: "42"
 *                 name: "Agder"
 *                 code: "42"
 *               - id: "46"
 *                 name: "Vestland"
 *                 code: "46"
 *               - id: "50"
 *                 name: "Trøndelag"
 *                 code: "50"
 *               - id: "54"
 *                 name: "Troms og Finnmark"
 *                 code: "54"
 *       500:
 *         description: Internal server error - failed to fetch counties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch fylker"
 */

export async function GET() {
  try {
    const fylker = await locationService.getFylker();
    return NextResponse.json(fylker);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch fylker' },
      { status: 500 }
    );
  }
}