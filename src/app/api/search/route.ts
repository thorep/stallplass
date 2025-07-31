import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { withApiLogging } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { BoxWithStablePreview, StableWithBoxStats } from "@/types/stable";
import { Prisma } from "@/generated/prisma";

interface UnifiedSearchFilters {
  // Common filters
  fylkeId?: string;
  kommuneId?: string;
  
  // Search mode
  mode: 'stables' | 'boxes';
  
  // Price filters (mode-specific)
  minPrice?: number;
  maxPrice?: number;
  
  // Amenity filters (mode-specific)
  amenityIds?: string[];
  
  // Box-specific filters
  occupancyStatus?: 'all' | 'available' | 'occupied';
  boxSize?: string;
  boxType?: 'boks' | 'utegang' | 'any';
  horseSize?: string;
  
  // Stable-specific filters
  availableSpaces?: 'any' | 'available';
  
  // Text search
  query?: string;
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Sorting
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc' | 'sponsored_first' | 'available_high' | 'available_low' | 'rating_high' | 'rating_low';
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
      mode: (searchParams.get("mode") as 'stables' | 'boxes') || 'boxes',
      fylkeId: searchParams.get("fylkeId") || undefined,
      kommuneId: searchParams.get("kommuneId") || undefined,
      minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
      amenityIds: searchParams.get("amenityIds")?.split(',').filter(Boolean) || undefined,
      occupancyStatus: (searchParams.get("occupancyStatus") as 'all' | 'available' | 'occupied') || undefined,
      boxSize: searchParams.get("boxSize") || undefined,
      boxType: (searchParams.get("boxType") as 'boks' | 'utegang' | 'any') || undefined,
      horseSize: searchParams.get("horseSize") || undefined,
      availableSpaces: (searchParams.get("availableSpaces") as 'any' | 'available') || undefined,
      query: searchParams.get("query") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
      sortBy: (searchParams.get("sortBy") as UnifiedSearchFilters["sortBy"]) || 'newest',
    };

    if (filters.mode === 'boxes') {
      return NextResponse.json(await searchBoxes(filters));
    } else {
      return NextResponse.json(await searchStables(filters));
    }
  } catch (error) {
    logger.error({ error }, "Unified search failed");
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function searchBoxes(filters: UnifiedSearchFilters): Promise<PaginatedResponse<BoxWithStablePreview>> {
  const now = new Date();
  
  // Build base where clause - only show boxes with active advertising
  const where: Prisma.boxesWhereInput = {
    advertisingActive: true,
    advertisingEndDate: { gt: now }
  };

  // Price filters
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  // Box-specific filters
  if (filters.horseSize && filters.horseSize !== 'any') {
    where.maxHorseSize = filters.horseSize;
  }
  
  if (filters.boxType && filters.boxType !== 'any') {
    where.boxType = filters.boxType === 'boks' ? 'BOKS' : 'UTEGANG';
  }

  // Occupancy status filtering
  if (filters.occupancyStatus === 'available') {
    where.isAvailable = true;
  } else if (filters.occupancyStatus === 'occupied') {
    where.isAvailable = false;
  }

  // Location filtering via stable
  if (filters.fylkeId || filters.kommuneId) {
    const stableWhere: Prisma.stablesWhereInput = {};
    if (filters.fylkeId) stableWhere.countyId = filters.fylkeId;
    if (filters.kommuneId) stableWhere.municipalityId = filters.kommuneId;
    where.stables = stableWhere;
  }

  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { 
        stables: {
          OR: [
            { name: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }

  // Handle amenity filtering - find boxes that have ALL selected amenities
  if (filters.amenityIds && filters.amenityIds.length > 0) {
    // Use a subquery approach to ensure the box has ALL required amenities
    // This is more efficient than fetching all and filtering in memory
    const validBoxIds = await prisma.$queryRaw<{box_id: string}[]>`
      SELECT DISTINCT box_id 
      FROM box_amenity_links 
      WHERE amenity_id = ANY(${filters.amenityIds})
      GROUP BY box_id 
      HAVING COUNT(DISTINCT amenity_id) = ${filters.amenityIds.length}
    `;

    if (validBoxIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false
        }
      };
    }

    where.id = { in: validBoxIds.map(row => row.box_id) };
  }

  // Build orderBy based on sortBy parameter
  let orderBy: Prisma.boxesOrderByWithRelationInput[] = [];
  
  switch (filters.sortBy) {
    case 'newest':
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }];
      break;
    case 'price_low':
      orderBy = [{ price: 'asc' }];
      break;
    case 'price_high':
      orderBy = [{ price: 'desc' }];
      break;
    case 'name_asc':
      orderBy = [{ name: 'asc' }];
      break;
    case 'name_desc':
      orderBy = [{ name: 'desc' }];
      break;
    case 'available_high':
      orderBy = [{ isAvailable: 'desc' }, { createdAt: 'desc' }];
      break;
    case 'available_low':
      orderBy = [{ isAvailable: 'asc' }, { createdAt: 'desc' }];
      break;
    case 'sponsored_first':
    default:
      orderBy = [
        { isSponsored: 'desc' },
        { isAvailable: 'desc' },
        { createdAt: 'desc' }
      ];
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
          box_amenities: true
        }
      },
      stables: {
        include: {
          counties: true,
          municipalities: true
        }
      }
    },
    orderBy,
    skip,
    take: pageSize,
  });

  // Transform to expected format
  const items = boxes.map(box => ({
    ...box,
    amenities: box.box_amenity_links.map(link => ({
      amenity: link.box_amenities
    })),
    stable: {
      id: box.stables.id,
      name: box.stables.name,
      location: box.stables.address || '',
      city: (box.stables as typeof box.stables & { postalPlace?: string }).postalPlace || null,
      county: box.stables.counties?.name || null,
      rating: box.stables.rating,
      reviewCount: box.stables.reviewCount,
      images: box.stables.images,
      imageDescriptions: box.stables.imageDescriptions
    },
    // Add location fields for formatLocationDisplay
    address: box.stables.address,
    postalPlace: box.stables.postalPlace,
    municipalities: box.stables.municipalities,
    counties: box.stables.counties
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages
    }
  };
}

async function searchStables(filters: UnifiedSearchFilters): Promise<PaginatedResponse<StableWithBoxStats>> {
  // Build where clause based on filters
  const where: Prisma.stablesWhereInput = {};
  
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
        price: priceFilter
      }
    };
  }
  
  // Available spaces filter - only show stables with available boxes
  if (filters.availableSpaces === 'available') {
    if (where.boxes && 'some' in where.boxes) {
      (where.boxes.some as Prisma.boxesWhereInput).isAvailable = true;
    } else {
      where.boxes = {
        some: {
          isAvailable: true
        }
      };
    }
  }
  
  // Amenity filters - filter stables that have ALL selected amenities
  if (filters.amenityIds && filters.amenityIds.length > 0) {
    // Use a subquery approach to ensure the stable has ALL required amenities
    const validStableIds = await prisma.$queryRaw<{stable_id: string}[]>`
      SELECT DISTINCT stable_id 
      FROM stable_amenity_links 
      WHERE amenity_id = ANY(${filters.amenityIds})
      GROUP BY stable_id 
      HAVING COUNT(DISTINCT amenity_id) = ${filters.amenityIds.length}
    `;

    if (validStableIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          totalItems: 0,
          totalPages: 0,
          hasMore: false
        }
      };
    }

    where.id = { in: validStableIds.map(row => row.stable_id) };
  }
  
  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } }
    ];
  }
  
  // Build orderBy based on sortBy parameter
  let orderBy: Prisma.stablesOrderByWithRelationInput = {};
  
  switch (filters.sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'name_asc':
      orderBy = { name: 'asc' };
      break;
    case 'name_desc':
      orderBy = { name: 'desc' };
      break;
    case 'rating_high':
      orderBy = { rating: 'desc' };
      break;
    case 'rating_low':
      orderBy = { rating: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
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
          stable_amenities: true
        }
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
  const stablesWithStats: StableWithBoxStats[] = stables.map(stable => {
    const boxes = stable.boxes || [];
    const availableBoxes = boxes.filter(box => box.isAvailable).length;
    const prices = boxes.map(box => box.price).filter(price => price > 0);
    const priceRange = prices.length > 0 
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
      createdAt: stable.createdAt,
      updatedAt: stable.updatedAt,
      ownerId: stable.ownerId,
      availableBoxes,
      priceRange,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      counties: stable.counties,
      municipalities: stable.municipalities
    };
  });
  
  logger.info({ count: stablesWithStats.length, mode: 'stables', page, totalPages }, "Search completed");
  
  return {
    items: stablesWithStats,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages
    }
  };
}

export const GET = withApiLogging(unifiedSearch);