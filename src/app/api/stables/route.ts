import { logBusinessOperation, withApiLogging } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { authenticateRequest, withAuth } from "@/lib/supabase-auth-middleware";
import {
  createStable,
  getAllStables,
  getAllStablesWithBoxStats,
  getStablesByOwner,
} from "@/services/stable-service";
import { NextRequest, NextResponse } from "next/server";

async function getStables(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id");
    const withBoxStats = searchParams.get("withBoxStats") === "true";

    if (ownerId && withBoxStats) {
      // Fetch stables for a specific owner with box statistics - requires authentication
      const authResult = await authenticateRequest(request);
      if (!authResult || authResult.uid !== ownerId) {
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
      const authResult = await authenticateRequest(request);
      if (!authResult || authResult.uid !== ownerId) {
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
    return NextResponse.json({ error: "Failed to fetch stables" }, { status: 500 });
  }
}

const createStableHandler = async (request: NextRequest, { userId }: { userId: string }) => {
  const startTime = Date.now();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    logger.info({ userId, stableData: body }, "Creating new stable");
    console.log("Received stable data in API:", body);

    const stableData = {
      name: body.name as string,
      description: body.description as string,
      location: (body.location || body.city || "") as string, // location is required
      address: body.address as string,
      city: body.city as string,
      postnummer: (body.postalCode || body.postal_code) as string, // Service expects 'postnummer'
      poststed: body.poststed as string, // Service expects 'poststed'
      county: body.county as string,
      municipality: body.municipality as string, // Kommune name for location data
      kommuneNumber: body.kommuneNumber as string, // Kommune number for location lookup
      latitude: (body.coordinates as { lat?: number })?.lat || null,
      longitude: (body.coordinates as { lon?: number })?.lon || null,
      images: (body.images || []) as string[],
      imageDescriptions: (body.image_descriptions || body.imageDescriptions || []) as string[],
      amenityIds: (body.amenityIds || body.fasilitetIds || []) as string[], // Array of amenity IDs
      ownerId: userId, // Use authenticated user ID
      updatedAt: new Date(), // Required field
    };
    console.log("STABLE DATA: ", stableData);
    const stable = await createStable(stableData);
    const duration = Date.now() - startTime;

    logBusinessOperation("create_stable", "success", {
      userId,
      resourceId: stable.id,
      resourceType: "stable",
      duration,
    });

    logger.info({ stableId: stable.id, duration }, "Stable created successfully");
    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;

    logBusinessOperation("create_stable", "failure", {
      userId,
      duration,
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    });

    logger.error(
      {
        error,
        userId,
        duration,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to create stable"
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create stable" },
      { status: 500 }
    );
  }
};

export const POST = withAuth(createStableHandler);

export const GET = withApiLogging(getStables);
