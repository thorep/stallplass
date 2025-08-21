import { logBusinessOperation, withApiLogging } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import {
  createStable,
  getAllStables,
  getAllStablesWithBoxStats,
  getStablesByOwner,
} from "@/services/stable-service";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/stables:
 *   get:
 *     summary: Get stables with optional filtering
 *     description: |
 *       Retrieves stables based on query parameters:
 *       - No params: All public stables
 *       - `withBoxStats=true`: All stables with box statistics for listings
 *       - `owner_id`: Stables owned by specific user (requires authentication and must be own stables)
 *       - `owner_id` + `withBoxStats=true`: Owner's stables with detailed box statistics
 *     tags: [Stables]
 *     parameters:
 *       - in: query
 *         name: owner_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter stables by owner ID (requires authentication, can only access own stables)
 *       - in: query
 *         name: withBoxStats
 *         schema:
 *           type: boolean
 *         description: Include box statistics in response
 *     security:
 *       - BearerAuth: []
 *         description: Required only when using owner_id parameter
 *     responses:
 *       200:
 *         description: Stables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Stable'
 *                   - type: object
 *                     properties:
 *                       boxStats:
 *                         type: object
 *                         description: Box statistics (when withBoxStats=true)
 *                         properties:
 *                           totalBoxes:
 *                             type: integer
 *                             description: Total number of boxes
 *                           availableBoxes:
 *                             type: integer
 *                             description: Number of available boxes
 *                           averagePrice:
 *                             type: number
 *                             format: float
 *                             description: Average box price
 *       401:
 *         description: Unauthorized - Invalid token or attempting to access other user's stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized - can only fetch your own stables"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch stables"
 */
async function getStables(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id");
    const withBoxStats = searchParams.get("withBoxStats") === "true";

    if (ownerId && withBoxStats) {
      // Fetch stables for a specific owner with box statistics - requires authentication
      const authResult = await requireAuth();
      if (authResult instanceof NextResponse) return authResult;
      const user = authResult;
      if (user.id !== ownerId) {
        return NextResponse.json(
          { error: "Unauthorized - can only fetch your own stables" },
          { status: 401 }
        );
      }

      const stables = await getStablesByOwner(ownerId);
      logger.info(
        {
          ownerId,
          stableCount: stables.length,
          stableIds: stables.map((s) => s.id),
        },
        `Retrieved ${stables.length} stables for owner`
      );

      return NextResponse.json(stables);
    } else if (ownerId) {
      // Fetch stables for a specific owner (without box stats) - requires authentication
      const authResult = await requireAuth();
      if (authResult instanceof NextResponse) return authResult;
      const user = authResult;
      if (user.id !== ownerId) {
        return NextResponse.json(
          { error: "Unauthorized - can only fetch your own stables" },
          { status: 401 }
        );
      }

      const stables = await getStablesByOwner(ownerId);
      return NextResponse.json(stables);
    } else if (withBoxStats) {
      // Fetch stables with box statistics (for listings)
      const stables = await getAllStablesWithBoxStats();
      return NextResponse.json(stables);
    } else {
      // Fetch all stables
      const stables = await getAllStables();
      return NextResponse.json(stables);
    }
  } catch (error) {
    logger.error({ error }, "Error fetching stables");
    try {
      const { searchParams } = new URL(request.url);
      const ownerId = searchParams.get("owner_id");
      const withBoxStats = searchParams.get("withBoxStats") === "true";
      captureApiError({ error, context: 'stables_get', route: '/api/stables', method: 'GET', ownerId, withBoxStats });
    } catch {}
    return NextResponse.json({ error: "Failed to fetch stables" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stables:
 *   post:
 *     summary: Create a new stable
 *     description: Creates a new stable owned by the authenticated user. Requires name, coordinates, and location information.
 *     tags: [Stables]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, latitude, longitude]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Stable name (required)
 *               description:
 *                 type: string
 *                 description: Stable description
 *               location:
 *                 type: string
 *                 description: Location/city name
 *               address:
 *                 type: string
 *                 description: Street address
 *               city:
 *                 type: string
 *                 description: City name
 *               postalCode:
 *                 type: string
 *                 description: Postal code (mapped to postnummer)
 *               poststed:
 *                 type: string
 *                 description: Postal area
 *               county:
 *                 type: string
 *                 description: County/fylke
 *               municipality:
 *                 type: string
 *                 description: Municipality/kommune name
 *               kommuneNumber:
 *                 type: string
 *                 description: Municipality number for location lookup
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate (required)
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate (required)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of image URLs
 *               imageDescriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image descriptions
 *               amenityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of amenity IDs (fasilitet IDs)
 *           example:
 *             name: "Østby Rideskole"
 *             description: "En moderne rideskole med gode fasiliteter"
 *             location: "Oslo"
 *             address: "Storgata 123"
 *             city: "Oslo"
 *             postalCode: "0123"
 *             poststed: "Oslo"
 *             county: "Oslo"
 *             municipality: "Oslo"
 *             kommuneNumber: "0301"
 *             latitude: 59.9139
 *             longitude: 10.7522
 *             images: ["https://example.com/stable1.jpg"]
 *             imageDescriptions: ["Main stable building"]
 *             amenityIds: ["amenity-uuid-1", "amenity-uuid-2"]
 *     responses:
 *       201:
 *         description: Stable created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_name:
 *                 value:
 *                   error: "Name is required and must be a non-empty string"
 *               missing_latitude:
 *                 value:
 *                   error: "Latitude is required and must be a number"
 *               missing_longitude:
 *                 value:
 *                   error: "Longitude is required and must be a number"
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
 */
async function createStableHandler(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  const profileId = user.id;
  const startTime = Date.now();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    logger.info({ profileId, stableData: body }, "Creating new stable");

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      logger.error({ name: body.name }, "Validation failed: Name is required");
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Handle coordinates - client sends them directly, not nested
    const latitude = body.latitude as number;
    const longitude = body.longitude as number;

    if (latitude === undefined || latitude === null || typeof latitude !== 'number') {
      logger.error({ latitude, bodyLatitude: body.latitude }, "Validation failed: Latitude is required and must be a number");
      return NextResponse.json(
        { error: "Latitude is required and must be a number" },
        { status: 400 }
      );
    }

    if (longitude === undefined || longitude === null || typeof longitude !== 'number') {
      logger.error({ longitude, bodyLongitude: body.longitude }, "Validation failed: Longitude is required and must be a number");
      return NextResponse.json(
        { error: "Longitude is required and must be a number" },
        { status: 400 }
      );
    }

    // Removed single-stable-per-user restriction: users can now create multiple stables

    const stableData = {
      name: body.name,
      description: body.description as string,
      location: (body.location || body.city || "") as string, // location is required
      address: body.address as string,
      city: body.city as string,
      postnummer: (body.postalCode || body.postal_code) as string, // Service expects 'postnummer'
      poststed: body.poststed as string, // Service expects 'poststed'
      county: body.county as string,
      municipality: body.municipality as string, // Kommune name for location data
      kommuneNumber: body.kommuneNumber as string, // Kommune number for location lookup
      latitude,
      longitude,
      images: (body.images || []) as string[],
      imageDescriptions: (body.image_descriptions || body.imageDescriptions || []) as string[],
      amenityIds: (body.amenityIds || body.fasilitetIds || []) as string[], // Array of amenity IDs
      ownerId: profileId, // Use authenticated user ID
      updatedAt: new Date(), // Required field
    };
    const stable = await createStable(stableData);
    const duration = Date.now() - startTime;

    logBusinessOperation("create_stable", "success", {
      userId: profileId, // backward compatibility
      resourceId: stable.id,
      resourceType: "stable",
      duration,
    });

    logger.info({ stableId: stable.id, duration }, "Stable created successfully");
    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;

    logBusinessOperation("create_stable", "failure", {
      userId: profileId, // backward compatibility
      duration,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    });

    logger.error(
      {
        error,
        profileId,
        duration,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to create stable"
    );
    try {
      captureApiError({ error, context: 'stable_create_post', route: '/api/stables', method: 'POST', duration, distinctId: profileId });
    } catch {}

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create stable" },
      { status: 500 }
    );
  }
};

export const POST = createStableHandler;

export const GET = withApiLogging(getStables);
