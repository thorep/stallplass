import { Prisma } from "@/generated/prisma";
import { withApiLogging } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { prisma } from "@/services/prisma";
import { BoxWithStablePreview, StableWithBoxStats } from "@/types/stable";
import { ServiceWithDetails } from "@/types/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Unified search for stables and boxes
 *     description: |
 *       Advanced search endpoint supporting both stables and boxes with extensive filtering options.
 *       Shows all active items on the free platform and excludes archived content.
 *       Supports pagination, sorting, and text search across multiple fields.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stables, boxes, services]
 *           default: boxes
 *         description: Search mode - whether to search for stables, boxes, or services
 *       - in: query
 *         name: fylkeId
 *         schema:
 *           type: string
 *         description: Filter by county/fylke ID
 *       - in: query
 *         name: kommuneId
 *         schema:
 *           type: string
 *         description: Filter by municipality/kommune ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum price filter (in NOK)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum price filter (in NOK)
 *       - in: query
 *         name: amenityIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenity IDs for boxes mode (must have ALL amenities)
 *         example: "amenity1,amenity2,amenity3"
 *       - in: query
 *         name: stableAmenityIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of stable amenity IDs for boxes mode (must have ALL stable amenities)
 *         example: "stable1,stable2,stable3"
 *       - in: query
 *         name: occupancyStatus
 *         schema:
 *           type: string
 *           enum: [all, available, occupied]
 *         description: Filter by occupancy status (boxes mode only)
 *       - in: query
 *         name: boxSize
 *         schema:
 *           type: string
 *         description: Filter by box size (boxes mode only)
 *       - in: query
 *         name: boxType
 *         schema:
 *           type: string
 *           enum: [boks, utegang, any]
 *         description: Filter by box type (boxes mode only)
 *       - in: query
 *         name: horseSize
 *         schema:
 *           type: string
 *         description: Filter by maximum horse size (boxes mode only)
 *       - in: query
 *         name: availableSpaces
 *         schema:
 *           type: string
 *           enum: [any, available]
 *         description: Filter stables by available spaces (stables mode only)
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [veterinarian, farrier, trainer]
 *         description: Filter by service type (services mode only)
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Text search across names and descriptions
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_low, price_high, name_asc, name_desc, sponsored_first, available_high, available_low, rating_high, rating_low]
 *           default: newest
 *         description: |
 *           Sort order for results:
 *           - newest/oldest: By creation date
 *           - price_low/price_high: By price (boxes mode)
 *           - name_asc/name_desc: Alphabetical by name
 *           - sponsored_first: Sponsored items first (boxes mode)
 *           - available_high/available_low: By availability (boxes mode)
 *           - rating_high/rating_low: By rating (stables mode)
 *
 *           Note: Sponsored boxes are always prioritized first in boxes mode
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/Box'
 *                       - $ref: '#/components/schemas/Stable'
 *                   description: Search results (boxes or stables based on mode)
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     pageSize:
 *                       type: integer
 *                       description: Items per page
 *                     totalItems:
 *                       type: integer
 *                       description: Total number of matching items
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more pages available
 *             examples:
 *               boxes_search:
 *                 summary: Box search results
 *                 value:
 *                   items: []
 *                   pagination:
 *                     page: 1
 *                     pageSize: 20
 *                     totalItems: 0
 *                     totalPages: 0
 *                     hasMore: false
 *               stables_search:
 *                 summary: Stable search results
 *                 value:
 *                   items: []
 *                   pagination:
 *                     page: 1
 *                     pageSize: 20
 *                     totalItems: 0
 *                     totalPages: 0
 *                     hasMore: false
 *       500:
 *         description: Search failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Search failed"
 */

interface UnifiedSearchFilters {
  // Common filters
  fylkeId?: string;
  kommuneId?: string;

  // Search mode
  mode: "stables" | "boxes" | "services";

  // Price filters (mode-specific)
  minPrice?: number;
  maxPrice?: number;

  // Amenity filters (mode-specific)
  amenityIds?: string[];
  stableAmenityIds?: string[]; // For filtering boxes by stable amenities

  // Box-specific filters
  occupancyStatus?: "all" | "available" | "occupied";
  boxSize?: string;
  boxType?: "boks" | "utegang" | "any";
  horseSize?: string;

  // Stable-specific filters
  availableSpaces?: "any" | "available";

  // Service-specific filters
  serviceType?: string;

  // Text search
  query?: string;

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?:
    | "newest"
    | "oldest"
    | "price_low"
    | "price_high"
    | "name_asc"
    | "name_desc"
    | "sponsored_first"
    | "available_high"
    | "available_low"
    | "rating_high"
    | "rating_low";
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

async function unifiedSearch(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: UnifiedSearchFilters = {
      mode: (searchParams.get("mode") as "stables" | "boxes" | "services") || "boxes",
      fylkeId: searchParams.get("fylkeId") || undefined,
      kommuneId: searchParams.get("kommuneId") || undefined,
      minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
      amenityIds: searchParams.get("amenityIds")?.split(",").filter(Boolean) || undefined,
      stableAmenityIds:
        searchParams.get("stableAmenityIds")?.split(",").filter(Boolean) || undefined,
      occupancyStatus:
        (searchParams.get("occupancyStatus") as "all" | "available" | "occupied") || undefined,
      boxSize: searchParams.get("boxSize") || undefined,
      boxType: (searchParams.get("boxType") as "boks" | "utegang" | "any") || undefined,
      horseSize: searchParams.get("horseSize") || undefined,
      availableSpaces: (searchParams.get("availableSpaces") as "any" | "available") || undefined,
      serviceType: searchParams.get("serviceType") || undefined,
      query: searchParams.get("query") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
      sortBy: (searchParams.get("sortBy") as UnifiedSearchFilters["sortBy"]) || "newest",
    };
    if (filters.mode === "boxes") {
      return NextResponse.json(await searchBoxes(filters));
    } else if (filters.mode === "services") {
      return NextResponse.json(await searchServices(filters));
    } else {
      return NextResponse.json(await searchStables(filters));
    }
  } catch (error) {
    logger.error({ error }, "Unified search failed");
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function searchBoxes(
  filters: UnifiedSearchFilters
): Promise<PaginatedResponse<BoxWithStablePreview>> {
  // Build base where clause - show all active boxes (platform is now free)
  const where: Prisma.boxesWhereInput = {
    archived: false, // Exclude archived boxes from public search
    isAvailable: true, // Only show available boxes by default
  };

  // Price filters
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  // Box-specific filters
  if (filters.horseSize && filters.horseSize !== "any") {
    where.maxHorseSize = filters.horseSize;
  }

  if (filters.boxType && filters.boxType !== "any") {
    where.boxType = filters.boxType === "boks" ? "BOKS" : "UTEGANG";
  }

  // Occupancy status filtering
  if (filters.occupancyStatus === "available") {
    where.isAvailable = true;
  } else if (filters.occupancyStatus === "occupied") {
    where.isAvailable = false;
  } else if (filters.occupancyStatus === "all") {
    // Show both available and occupied boxes
    delete where.isAvailable;
  }

  // Location filtering via stable - always exclude archived stables
  const stableWhere: Prisma.stablesWhereInput = {
    archived: false, // Exclude archived stables
  };
  if (filters.fylkeId) stableWhere.countyId = filters.fylkeId;
  if (filters.kommuneId) stableWhere.municipalityId = filters.kommuneId;
  where.stables = stableWhere;

  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
      {
        stables: {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { description: { contains: filters.query, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // Handle amenity filtering - find boxes that have ALL selected amenities
  if (filters.amenityIds && filters.amenityIds.length > 0) {
    // Use a subquery approach to ensure the box has ALL required amenities
    // This is more efficient than fetching all and filtering in memory
    const validBoxIds = await prisma.$queryRaw<{ boxId: string }[]>`
      SELECT DISTINCT "boxId" 
      FROM box_amenity_links 
      WHERE "amenityId" = ANY(${filters.amenityIds})
      GROUP BY "boxId" 
      HAVING COUNT(DISTINCT "amenityId") = ${filters.amenityIds.length}
    `;

    if (validBoxIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    where.id = { in: validBoxIds.map((row) => row.boxId) };
  }

  // Handle stable amenity filtering for boxes - find boxes whose stables have ALL selected stable amenities
  if (filters.stableAmenityIds && filters.stableAmenityIds.length > 0) {
    // Use a subquery approach to find stables that have ALL required amenities
    const validStableIds = await prisma.$queryRaw<{ stableId: string }[]>`
      SELECT DISTINCT "stableId" 
      FROM stable_amenity_links 
      WHERE "amenityId" = ANY(${filters.stableAmenityIds})
      GROUP BY "stableId" 
      HAVING COUNT(DISTINCT "amenityId") = ${filters.stableAmenityIds.length}
    `;

    if (validStableIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    // Filter boxes to only those from stables that have the required amenities
    if (where.stables && typeof where.stables === "object" && "id" in where.stables) {
      // If we already have stable filters, combine them
      where.stables = {
        ...where.stables,
        id: { in: validStableIds.map((row) => row.stableId) },
      };
    } else {
      // Add stable filter while preserving existing stable filters
      where.stables = {
        ...stableWhere,
        id: { in: validStableIds.map((row) => row.stableId) },
      };
    }
  }

  // Build orderBy based on sortBy parameter
  // ALWAYS prioritize sponsored boxes first, then apply the selected sort
  const orderBy: Prisma.boxesOrderByWithRelationInput[] = [
    { isSponsored: "desc" }, // Sponsored boxes always first
  ];

  switch (filters.sortBy) {
    case "newest":
      orderBy.push({ createdAt: "desc" });
      break;
    case "oldest":
      orderBy.push({ createdAt: "asc" });
      break;
    case "price_low":
      orderBy.push({ price: "asc" });
      break;
    case "price_high":
      orderBy.push({ price: "desc" });
      break;
    case "name_asc":
      orderBy.push({ name: "asc" });
      break;
    case "name_desc":
      orderBy.push({ name: "desc" });
      break;
    case "available_high":
      orderBy.push({ isAvailable: "desc" }, { createdAt: "desc" });
      break;
    case "available_low":
      orderBy.push({ isAvailable: "asc" }, { createdAt: "desc" });
      break;
    case "sponsored_first":
    default:
      orderBy.push({ isAvailable: "desc" }, { createdAt: "desc" });
      break;
  }

  // Calculate pagination values
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  // Get total count for pagination
  const totalItems = await prisma.boxes.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);

  const boxes = await prisma.boxes.findMany({
    where,
    include: {
      box_amenity_links: {
        include: {
          box_amenities: true,
        },
      },
      stables: {
        include: {
          counties: true,
          municipalities: true,
          stable_amenity_links: {
            include: {
              stable_amenities: true,
            },
          },
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  });

  // Transform to expected format
  const items = boxes.map((box) => ({
    ...box,
    amenities: box.box_amenity_links.map((link) => ({
      amenity: link.box_amenities,
    })),
    stable: {
      id: box.stables.id,
      name: box.stables.name,
      location: box.stables.address || "",
      city: (box.stables as typeof box.stables & { postalPlace?: string }).postalPlace || null,
      county: box.stables.counties?.name || null,
      rating: box.stables.rating,
      reviewCount: box.stables.reviewCount,
      images: box.stables.images,
      imageDescriptions: box.stables.imageDescriptions,
      latitude: box.stables.latitude,
      longitude: box.stables.longitude,
      countyId: box.stables.countyId,
      municipalityId: box.stables.municipalityId,
      counties: box.stables.counties
        ? {
            id: box.stables.counties.id,
            name: box.stables.counties.name,
          }
        : null,
      municipalities: box.stables.municipalities
        ? {
            id: box.stables.municipalities.id,
            name: box.stables.municipalities.name,
          }
        : null,
      owner: undefined,
      amenities: box.stables.stable_amenity_links?.map((link) => ({
        amenity: link.stable_amenities,
      })) || [],
    },
    // Add location fields for formatLocationDisplay
    address: box.stables.address,
    postalPlace: box.stables.postalPlace,
    municipalities: box.stables.municipalities,
    counties: box.stables.counties,
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

async function searchStables(
  filters: UnifiedSearchFilters
): Promise<PaginatedResponse<StableWithBoxStats>> {
  // Build where clause based on filters
  const where: Prisma.stablesWhereInput = {
    archived: false, // Exclude archived stables from public search
  };
  // Location filters
  if (filters.fylkeId) where.countyId = filters.fylkeId;
  if (filters.kommuneId) where.municipalityId = filters.kommuneId;

  // Price filters - filter stables that have boxes in the price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter: Prisma.FloatFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;

    where.boxes = {
      some: {
        price: priceFilter,
      },
    };
  }

  // Available spaces filter - show stables with available boxes (platform is free)
  if (filters.availableSpaces === "available") {
    const availableBoxFilter: Prisma.boxesWhereInput = {
      isAvailable: true,
      archived: false,
    };
    
    if (where.boxes && "some" in where.boxes) {
      // Merge with existing box filters
      where.boxes.some = {
        ...(where.boxes.some as Prisma.boxesWhereInput),
        ...availableBoxFilter,
      };
    } else {
      where.boxes = {
        some: availableBoxFilter,
      };
    }
  }
  // Amenity filters - filter stables that have ALL selected amenities
  if (filters.amenityIds && filters.amenityIds.length > 0) {
    // Use a subquery approach to ensure the stable has ALL required amenities
    const validStableIds = await prisma.$queryRaw<{ stableId: string }[]>`
      SELECT DISTINCT "stableId" 
      FROM stable_amenity_links 
      WHERE "amenityId" = ANY(${filters.amenityIds})
      GROUP BY "stableId" 
      HAVING COUNT(DISTINCT "amenityId") = ${filters.amenityIds.length}
    `;

    if (validStableIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    where.id = { in: validStableIds.map((row) => row.stableId) };
  }

  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  // Build orderBy based on sortBy parameter
  let orderBy: Prisma.stablesOrderByWithRelationInput = {};

  switch (filters.sortBy) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "name_desc":
      orderBy = { name: "desc" };
      break;
    case "rating_high":
      orderBy = { rating: "desc" };
      break;
    case "rating_low":
      orderBy = { rating: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // Calculate pagination values
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  // Get total count for pagination
  const totalItems = await prisma.stables.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get stables with their data
  const stables = await prisma.stables.findMany({
    where,
    include: {
      stable_amenity_links: {
        include: {
          stable_amenities: true,
        },
      },
      boxes: true,
      counties: true,
      municipalities: true,
    },
    orderBy,
    skip,
    take: pageSize,
  });

  // Calculate stats for each stable and transform to match StableWithBoxStats
  const stablesWithStats: StableWithBoxStats[] = stables.map((stable) => {
    const boxes = stable.boxes || [];
    // Count all available boxes (platform is now free)
    const availableBoxes = boxes.filter(
      (box) => box.isAvailable && !box.archived
    ).length;
    const prices = boxes.map((box) => box.price).filter((price) => price > 0);
    const priceRange =
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };

    return {
      id: stable.id,
      name: stable.name,
      description: stable.description,
      address: stable.address,
      postalCode: stable.postalCode,
      postalPlace: stable.postalPlace,
      countyId: stable.countyId,
      municipalityId: stable.municipalityId,
      latitude: stable.latitude,
      longitude: stable.longitude,
      images: stable.images,
      imageDescriptions: stable.imageDescriptions,
      rating: stable.rating,
      reviewCount: stable.reviewCount,
      viewCount: stable.viewCount,
      createdAt: stable.createdAt,
      updatedAt: stable.updatedAt,
      ownerId: stable.ownerId,
      archived: stable.archived,
      deletedAt: stable.deletedAt,
      availableBoxes,
      priceRange,
      amenities: stable.stable_amenity_links.map((link) => ({
        amenity: link.stable_amenities,
      })),
      counties: stable.counties,
      municipalities: stable.municipalities,
    } as StableWithBoxStats;
  });

  logger.info(
    { count: stablesWithStats.length, mode: "stables", page, totalPages },
    "Search completed"
  );

  return {
    items: stablesWithStats,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

async function searchServices(
  filters: UnifiedSearchFilters
): Promise<PaginatedResponse<ServiceWithDetails>> {
  // Build where conditions
  const where: {
    isActive: boolean;
    archived: boolean;
    serviceTypeId?: string;
    priceRangeMin?: { gte: number };
    priceRangeMax?: { lte: number };
    service_areas?: { some: Record<string, string> };
    OR?: Array<Record<string, unknown>>;
  } = {
    isActive: true,
    archived: false
  };

  // Apply service type filter
  if (filters.serviceType) {
    try {
      // Find the service type by name
      const serviceType = await prisma.service_types.findUnique({
        where: { name: filters.serviceType.toUpperCase() },
        select: { id: true }
      });
      
      if (serviceType) {
        where.serviceTypeId = serviceType.id;
      } else {
        logger.warn({ serviceType: filters.serviceType }, "Service type not found");
        // Return empty results for non-existent service type
        return {
          items: [],
          pagination: {
            page: filters.page || 1,
            pageSize: filters.pageSize || 20,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }
    } catch (error) {
      logger.error({ error, serviceType: filters.serviceType }, "Error finding service type");
      // Return empty results for error
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  // Apply price filters
  if (filters.minPrice) {
    where.priceRangeMin = {
      gte: filters.minPrice
    };
  }

  if (filters.maxPrice) {
    where.priceRangeMax = {
      lte: filters.maxPrice
    };
  }

  // Apply location filters using service_areas relation
  if (filters.fylkeId || filters.kommuneId) {
    const areaFilters: Record<string, string> = {};
    if (filters.fylkeId) {
      areaFilters.county = filters.fylkeId;
    }
    if (filters.kommuneId) {
      areaFilters.municipality = filters.kommuneId;
    }
    
    where.service_areas = {
      some: areaFilters
    };
  }

  // Text search
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  // Build orderBy based on sortBy parameter
  let orderBy: Prisma.servicesOrderByWithRelationInput = {};

  switch (filters.sortBy) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price_low":
      orderBy = { priceRangeMin: "asc" };
      break;
    case "price_high":
      orderBy = { priceRangeMax: "desc" };
      break;
    case "name_asc":
      orderBy = { title: "asc" };
      break;
    case "name_desc":
      orderBy = { title: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // Calculate pagination values
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  // Get total count for pagination
  const totalItems = await prisma.services.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get services with their data
  const services = await prisma.services.findMany({
    where,
    include: {
      service_areas: true,
      service_types: {
        select: {
          name: true,
          displayName: true
        }
      },
      profiles: {
        select: {
          nickname: true,
          phone: true
        }
      }
    },
    orderBy,
    skip,
    take: pageSize,
  });

  // Get all unique county and municipality IDs for name resolution
  const countyIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.county)))];
  const municipalityIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.municipality).filter(Boolean)))];
  
  // Fetch county and municipality names
  const [counties, municipalities] = await Promise.all([
    countyIds.length > 0 ? prisma.counties.findMany({
      where: { id: { in: countyIds } },
      select: { id: true, name: true }
    }) : [],
    municipalityIds.length > 0 ? prisma.municipalities.findMany({
      where: { id: { in: municipalityIds as string[] } },
      select: { id: true, name: true }
    }) : []
  ]);
  
  // Create lookup maps
  const countyMap = new Map(counties.map(c => [c.id, c.name]));
  const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
  
  // Transform to match ServiceWithDetails interface with location names
  const servicesWithDetails = services.map(service => ({
    ...service,
    serviceType: service.service_types.name.toLowerCase(), // Add the service type name
    areas: service.service_areas.map(area => ({
      ...area,
      county: area.county, // Keep the ID
      municipality: area.municipality, // Keep the ID
      countyName: countyMap.get(area.county) || area.county,
      municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
    })),
    images: service.images || [], // Handle potential null images
    profile: service.profiles
  })) as unknown as ServiceWithDetails[];

  logger.info(
    { count: servicesWithDetails.length, mode: "services", page, totalPages },
    "Services search completed"
  );

  return {
    items: servicesWithDetails,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export const GET = withApiLogging(unifiedSearch);
