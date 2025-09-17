/**
 * Box service for managing stable box data and operations
 * Handles CRUD operations for boxes, their amenities, and availability status
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';
import { Box, BoxWithStablePreview } from '@/types/stable';
import type { Prisma, box_amenities, boxes } from '@/generated/prisma';

// Helper function to calculate days remaining
function getDaysRemaining(endDate: Date | string | null): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Type for box with amenity links (currently unused but kept for future use)
// type BoxWithAmenityLinks = Prisma.boxesGetPayload<{
//   include: {
//     box_amenity_links: {
//       include: {
//         box_amenities: true;
//       };
//     };
//   };
// }>;

// Use Prisma UncheckedCreateInput to allow direct foreign key assignment
export type CreateBoxData = Omit<Prisma.boxesUncheckedCreateInput, 'box_amenity_links' | 'conversations' | 'page_views' | 'rentals'> & {
  amenityIds?: string[];
};

export type UpdateBoxData = Omit<Prisma.boxesUpdateInput, 'stables' | 'conversations' | 'page_views' | 'invoice_requests' | 'box_amenity_links'> & {
  id: string;
  amenityIds?: string[];
};

export interface BoxFilters {
  stableId?: string;
  isAvailable?: boolean; // For backward compatibility
  occupancyStatus?: 'all' | 'available' | 'occupied';
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  fylkeId?: string;
  kommuneId?: string;
  max_horse_size?: string;
  maxHorseSize?: string;
  minSize?: number;
  availableOnly?: boolean;
  amenityIds?: string[];
  dagsleie?: boolean;
}

/**
 * Create a new box (server-side with elevated permissions)
 */
export async function createBoxServer(data: CreateBoxData): Promise<Box> {
  const { amenityIds, ...boxData } = data;

  try {
    const box = await prisma.boxes.create({
      data: {
        ...boxData,
        availableQuantity: boxData.availableQuantity ?? 1,
        // Add amenity links if provided
        ...(amenityIds && amenityIds.length > 0 && {
          box_amenity_links: {
            create: amenityIds.map(amenityId => ({
              amenityId
            }))
          }
        })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      }
    });

    // Transform to match expected Box type
    const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
      ...box,
      amenities: box.box_amenity_links.map(link => ({
        amenity: link.box_amenities
      }))
    };
    return transformedBox as Box;
  } catch (error) {
    throw new Error(`Failed to create box: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new box (client-side with RLS)
 */
export async function createBox(data: CreateBoxData): Promise<Box> {
  // For client-side, use the same Prisma logic as server-side
  // Note: RLS would be handled at the database level or through middleware
  return createBoxServer(data);
}

/**
 * Update an existing box
 */
export async function updateBox(data: UpdateBoxData): Promise<Box> {
  const { id, amenityIds, ...updateData } = data;

  try {
    // Remove any fields that shouldn't be updated directly
    const cleanUpdateData: Partial<typeof updateData> = { ...updateData };
    if ('stableId' in cleanUpdateData) {
      delete cleanUpdateData.stableId; // Don't allow changing stable ownership
    }
    if ('createdAt' in cleanUpdateData) {
      delete cleanUpdateData.createdAt; // Don't allow changing creation time
    }
    
    const box = await prisma.boxes.update({
      where: { id },
      data: {
        ...cleanUpdateData,
        updatedAt: new Date(), // Ensure updatedAt is always set
        // Handle amenity updates if provided
        ...(amenityIds !== undefined && {
          box_amenity_links: {
            deleteMany: {}, // Delete all existing links
            create: amenityIds.map(amenityId => ({
              amenityId
            }))
          }
        })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      }
    });

    // Transform to match expected Box type
    const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
      ...box,
      amenities: box.box_amenity_links.map(link => ({
        amenity: link.box_amenities
      }))
    };
    return transformedBox as Box;
  } catch (error) {
    logger.error({ error, id, amenityIds }, 'updateBox service error');
    throw new Error(`Failed to update box: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a box
 */
export async function deleteBox(id: string): Promise<void> {
  try {
    // First, get the box data for snapshots
    const box = await prisma.boxes.findUnique({
      where: { id },
      include: {
        stables: true
      }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    if (box.archived) {
      throw new Error('Box is already archived');
    }

    // SNAPSHOT: Update conversations with box data before soft deletion
    await prisma.conversations.updateMany({
      where: { boxId: id },
      data: {
        boxSnapshot: {
          name: box.name,
          price: box.price,
          images: box.images[0] || null, // First image only
          deletedAt: new Date().toISOString()
        }
      }
    });

    // Soft delete the box
    await prisma.boxes.update({
      where: { id },
      data: {
        archived: true,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    throw new Error(`Failed to delete box: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore an archived box
 */
export async function restoreBox(id: string): Promise<void> {
  try {
    const box = await prisma.boxes.findUnique({
      where: { id }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    if (!box.archived) {
      throw new Error('Box is not archived');
    }

    // Restore the box
    await prisma.boxes.update({
      where: { id },
      data: {
        archived: false,
        deletedAt: null
      }
    });
  } catch (error) {
    throw new Error(`Failed to restore box: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single box by ID
 */
export async function getBoxById(id: string, includeArchived: boolean = false): Promise<Box | null> {
  try {
    const box = await prisma.boxes.findFirst({
      where: { 
        id,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      }
    });

    if (!box) {
      return null;
    }

    // Transform to match expected Box type
    const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
      ...box,
      amenities: box.box_amenity_links.map(link => ({
        amenity: link.box_amenities
      }))
    };
    return transformedBox as Box;
  } catch (error) {
    throw new Error(`Failed to get box by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get multiple boxes by their IDs
 */
export async function getBoxesByIds(ids: string[], includeArchived: boolean = false): Promise<Box[]> {
  try {
    const boxes = await prisma.boxes.findMany({
      where: { 
        id: { 
          in: ids 
        },
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      }
    });

    // Transform the results to match the Box type
    return boxes.map((box) => ({
      ...box,
      amenities: box.box_amenity_links.map((link) => ({
        amenity: link.box_amenities
      }))
    })) as Box[];
  } catch (error) {
    console.error('Error fetching boxes by IDs:', error);
    throw new Error(`Failed to fetch boxes by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a box with stable information
 */
export async function getBoxWithStable(id: string, includeArchived: boolean = false): Promise<BoxWithStablePreview | null> {
  try {
    const box = await prisma.boxes.findFirst({
      where: { 
        id,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        },
        stables: {
          include: {
            counties: true,
            municipalities: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            },
            stable_amenity_links: {
              include: {
                stable_amenities: true
              }
            }
          }
        }
      }
    });

    if (!box) {
      return null;
    }

    // Transform to match expected BoxWithStablePreview type
    const transformedBox: BoxWithStablePreview = {
      ...box,
      amenities: box.box_amenity_links.map((link) => ({
        amenity: link.box_amenities
      })),
      stable: {
        id: box.stables.id,
        name: box.stables.name,
        location: box.stables.address || '',
        postalCode: box.stables.postalCode || null,
        postalPlace: box.stables.postalPlace || null,
        city: box.stables.postalPlace || null, // Using postalPlace for city
        county: box.stables.counties?.name || null,
        rating: box.stables.rating,
        reviewCount: box.stables.reviewCount,
        images: box.stables.images,
        imageDescriptions: box.stables.imageDescriptions,
        latitude: box.stables.latitude,
        longitude: box.stables.longitude,
        countyId: box.stables.countyId,
        municipalityId: box.stables.municipalityId,
        counties: box.stables.counties ? {
          id: box.stables.counties.id,
          name: box.stables.counties.name
        } : null,
        municipalities: box.stables.municipalities ? {
          id: box.stables.municipalities.id,
          name: box.stables.municipalities.name
        } : null,
        owner: box.stables.profiles ? {
          id: box.stables.profiles.id,
          nickname: box.stables.profiles.nickname
        } : undefined,
        amenities: box.stables.stable_amenity_links.map((link) => ({
          amenity: link.stable_amenities
        }))
      }
    };
    return transformedBox;
  } catch (error) {
    throw new Error(`Failed to get box with stable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all boxes for a stable
 */
export async function getBoxesByStableId(stable_id: string, includeArchived: boolean = false): Promise<Box[]> {
  try {
    const boxes = await prisma.boxes.findMany({
      where: { 
        stableId: stable_id,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform to match expected Box type with days remaining calculations
    return boxes.map(box => {
      const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
        ...box,
        amenities: box.box_amenity_links.map(link => ({
          amenity: link.box_amenities
        })),
        boostDaysRemaining: getDaysRemaining(box.sponsoredUntil),
      };
      return transformedBox as Box;
    });
  } catch (error) {
    throw new Error(`Failed to get boxes by stable ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search boxes within a specific stable
 */
export async function searchBoxesInStable(stable_id: string, filters: Omit<BoxFilters, 'stableId'> = {}): Promise<Box[]> {
  const {
    isAvailable,
    minPrice,
    maxPrice,
    maxHorseSize,
    amenityIds
  } = filters;

  try {
    // Build where clause
    const where: Prisma.boxesWhereInput = {
      stableId: stable_id,
      archived: false
    };

    if (isAvailable !== undefined) {
      // Map old isAvailable boolean to new availableQuantity logic
      where.availableQuantity = isAvailable ? { gt: 0 } : { equals: 0 };
    }
    if (maxHorseSize) where.maxHorseSize = maxHorseSize;
    if (minPrice !== undefined) {
      where.price = { ...where.price as object, gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price as object, lte: maxPrice };
    }

    // Handle amenity filtering - find boxes that have ALL selected amenities
    // Use efficient database-level filtering instead of N+1 queries
    if (amenityIds && amenityIds.length > 0) {
      // Use raw SQL subquery for efficient ALL amenities matching
      // This finds boxes where the count of matching amenities equals the required count
      const validBoxIds = await prisma.$queryRaw<{id: string}[]>`
        SELECT DISTINCT b.id
        FROM boxes b
        JOIN box_amenity_links bal ON b.id = bal."boxId"
        WHERE b."stableId" = ${stable_id}
          AND bal."amenityId" = ANY(${amenityIds})
        GROUP BY b.id
        HAVING COUNT(DISTINCT bal."amenityId") = ${amenityIds.length}
      `;

      if (validBoxIds.length === 0) {
        return [];
      }

      where.id = { in: validBoxIds.map(box => box.id) };
    }

    const boxes = await prisma.boxes.findMany({
      where,
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      },
      orderBy: [
        { isSponsored: 'desc' },
        { availableQuantity: 'desc' },
        { price: 'asc' },
        { name: 'asc' }
      ]
    });

    // Transform to match expected Box type
    return boxes.map(box => {
      const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
        ...box,
        amenities: box.box_amenity_links.map(link => ({
          amenity: link.box_amenities
        }))
      };
      return transformedBox as Box;
    });
  } catch (error) {
    throw new Error(`Failed to search boxes in stable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update expired sponsored boxes
 * Note: This is now handled by the cleanup service for consistency
 */
export async function updateExpiredSponsoredBoxes(): Promise<void> {
  const { cleanupExpiredContent } = await import('./cleanup-service');
  await cleanupExpiredContent();
}

/**
 * Search boxes with filters across all stables
 */
export async function searchBoxes(filters: BoxFilters = {}): Promise<BoxWithStablePreview[]> {
  // Search boxes with filters
  
  const {
    stableId,
    isAvailable,
    occupancyStatus,
    minPrice,
    maxPrice,
    fylkeId,
    kommuneId,
    maxHorseSize,
    amenityIds,
    dagsleie
  } = filters;

  try {
    // Build base where clause - show all non-archived boxes (platform is now free)
    const where: Prisma.boxesWhereInput = {
      archived: false
    };

    if (stableId) where.stableId = stableId;
    if (isAvailable !== undefined) {
      // Map old isAvailable boolean to new availableQuantity logic  
      where.availableQuantity = isAvailable ? { gt: 0 } : { equals: 0 };
    }
    if (maxHorseSize) where.maxHorseSize = maxHorseSize;
    if (dagsleie !== undefined) where.dagsleie = dagsleie;
    if (minPrice !== undefined) {
      where.price = { ...where.price as object, gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price as object, lte: maxPrice };
    }

    // Location filtering
    if (fylkeId || kommuneId) {
      const stableWhere: Prisma.stablesWhereInput = {};
      if (fylkeId) stableWhere.countyId = fylkeId;
      if (kommuneId) stableWhere.municipalityId = kommuneId;
      
      where.stables = stableWhere;
    }

    // Handle occupancy status filtering
    if (occupancyStatus === 'available') {
      // Only show available boxes
      where.availableQuantity = { gt: 0 };
    } else if (occupancyStatus === 'occupied') {
      // Only show occupied boxes (not available)
      where.availableQuantity = { equals: 0 };
    }

    // Handle amenity filtering - find boxes that have ALL selected amenities
    let validBoxIds: string[] | undefined;
    if (amenityIds && amenityIds.length > 0) {
      const boxesWithAmenities = await prisma.boxes.findMany({
        where: {
          ...where,
          box_amenity_links: {
            some: {
              amenityId: {
                in: amenityIds
              }
            }
          }
        },
        include: {
          box_amenity_links: {
            where: {
              amenityId: {
                in: amenityIds
              }
            }
          }
        }
      });

      // Filter to only boxes that have ALL required amenities
      validBoxIds = boxesWithAmenities
        .filter(box => box.box_amenity_links.length === amenityIds.length)
        .map(box => box.id);

      if (validBoxIds.length === 0) {
        return [];
      }

      where.id = { in: validBoxIds };
    }

    // Executing query
    
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
      orderBy: [
        { isSponsored: 'desc' },
        { availableQuantity: 'desc' },
        { price: 'asc' }
      ]
    });

    // Query completed
    if (boxes && boxes.length > 0) {
      // Found boxes
    }

    // Transform to match expected BoxWithStablePreview type
    // Additionally, expose location fields at top-level (address/postalPlace/municipalities/counties)
    // so components that read location from the box object (not only box.stable) can render it.
    return boxes.map(box => {
      const transformedBox: BoxWithStablePreview = {
        ...box,
        amenities: box.box_amenity_links.map((link) => ({
          amenity: link.box_amenities
        })),
        // Top-level location fields for BoxListingCard/formatLocationDisplay
        address: box.stables.address || null,
        postalPlace: box.stables.postalPlace || null,
        // Keep full prisma types here to satisfy BoxWithStablePreview's municipalities/counties types
        municipalities: box.stables.municipalities || null,
        counties: box.stables.counties || null,
        stable: {
          id: box.stables.id,
          name: box.stables.name,
          location: box.stables.address || '',
          postalCode: box.stables.postalCode || null,
          postalPlace: box.stables.postalPlace || null,
          city: box.stables.postalPlace || null, // Using postalPlace for city
          county: box.stables.counties?.name || null,
          rating: box.stables.rating,
          reviewCount: box.stables.reviewCount,
          images: box.stables.images,
          imageDescriptions: box.stables.imageDescriptions,
          latitude: box.stables.latitude,
          longitude: box.stables.longitude,
          countyId: box.stables.countyId,
          municipalityId: box.stables.municipalityId,
          counties: box.stables.counties ? {
            id: box.stables.counties.id,
            name: box.stables.counties.name
          } : null,
          municipalities: box.stables.municipalities ? {
            id: box.stables.municipalities.id,
            name: box.stables.municipalities.name
          } : null
        }
      };
      return transformedBox;
    });
  } catch (error) {
    // Query error
    throw new Error(`Failed to search boxes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available boxes count for a stable
 */
export async function getAvailableBoxesCount(stable_id: string, includeArchived: boolean = false): Promise<number> {
  try {
    const count = await prisma.boxes.count({
      where: {
        stableId: stable_id,
        availableQuantity: { gt: 0 },
        ...(includeArchived ? {} : { archived: false })
      }
    });

    return count;
  } catch (error) {
    throw new Error(`Failed to get available boxes count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get total boxes count for a stable
 */
export async function getTotalBoxesCount(stable_id: string, includeArchived: boolean = false): Promise<number> {
  try {
    const count = await prisma.boxes.count({
      where: {
        stableId: stable_id,
        ...(includeArchived ? {} : { archived: false })
      }
    });

    return count;
  } catch (error) {
    throw new Error(`Failed to get total boxes count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get price range for boxes in a stable
 */
export async function getBoxPriceRange(stable_id: string, includeArchived: boolean = false): Promise<{ min: number; max: number } | null> {
  try {
    const result = await prisma.boxes.aggregate({
      where: {
        stableId: stable_id,
        price: { gt: 0 },
        ...(includeArchived ? {} : { archived: false })
      },
      _min: { price: true },
      _max: { price: true },
      _count: true
    });

    if (result._count === 0 || !result._min.price || !result._max.price) {
      return null;
    }

    return {
      min: result._min.price,
      max: result._max.price
    };
  } catch (error) {
    throw new Error(`Failed to get box price range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Purchase sponsored placement for a box
 */
export async function purchaseSponsoredPlacement(boxId: string, days: number): Promise<Box> {
  try {
    // Find the box to sponsor
    const box = await prisma.boxes.findUnique({
      where: { id: boxId },
      include: {
        stables: true
      }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    const now = new Date();

    // If box is already sponsored, extend from current end date
    const sponsoredUntil = box.sponsoredUntil ? new Date(box.sponsoredUntil) : null;
    const startDate = box.isSponsored && sponsoredUntil && sponsoredUntil > now 
      ? sponsoredUntil 
      : now;

    const endDate = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));

    // Update the box with sponsored placement
    const updatedBox = await prisma.boxes.update({
      where: { id: boxId },
      data: {
        isSponsored: true,
        sponsoredStartDate: box.isSponsored && box.sponsoredStartDate ? box.sponsoredStartDate : now,
        sponsoredUntil: endDate
      },
      include: {
        box_amenity_links: {
          include: {
            box_amenities: true
          }
        }
      }
    });

    // Transform to match expected Box type
    const transformedBox: Box & { amenities: { amenity: box_amenities }[] } = {
      ...updatedBox,
      amenities: updatedBox.box_amenity_links.map(link => ({
        amenity: link.box_amenities
      }))
    };
    return transformedBox as Box;
  } catch (error) {
    throw new Error(`Failed to purchase sponsored placement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get sponsored placement info for a box
 */
export async function getSponsoredPlacementInfo(boxId: string): Promise<{
  isSponsored: boolean;
  sponsoredUntil: Date | null;
  daysRemaining: number;
  maxDaysAvailable: number;
}> {
  try {
    const box = await prisma.boxes.findUnique({
      where: { id: boxId },
      include: {
        stables: true
      }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    const now = new Date();
    let daysRemaining = 0;
    let maxDaysAvailable = 0;

    const sponsoredUntil = box.sponsoredUntil ? new Date(box.sponsoredUntil) : null;

    // Calculate days remaining for current sponsorship
    if (box.isSponsored && sponsoredUntil && sponsoredUntil > now) {
      daysRemaining = Math.ceil((sponsoredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Since platform is now free, there's no limit on sponsored placement days
    maxDaysAvailable = 365; // Allow up to 1 year of sponsorship

    return {
      isSponsored: box.isSponsored ?? false,
      sponsoredUntil,
      daysRemaining,
      maxDaysAvailable
    };
  } catch (error) {
    throw new Error(`Failed to get sponsored placement info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// TODO: Real-time subscription functions removed during Prisma migration
// These functions were Supabase-specific and need to be replaced with
// alternative real-time solutions if needed (e.g., WebSockets, Server-Sent Events)
// or removed if real-time functionality is no longer required


/**
 * Update box availability status (for rental management)
 */
export async function updateBoxAvailability(
  boxId: string,
  userId: string,
  availableQuantity: number
): Promise<boxes> {
  try {
    // First verify the user owns the stable containing this box
    const box = await prisma.boxes.findUnique({
      where: { id: boxId },
      include: {
        stables: true
      }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    if (box.stables.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    // Update the box availability
    const updatedBox = await prisma.boxes.update({
      where: { id: boxId },
      data: {
        availableQuantity: Math.max(0, availableQuantity),
        updatedAt: new Date()
      }
    });

    return updatedBox;
  } catch (error) {
    if (error instanceof Error && (error.message === 'Box not found' || error.message === 'Unauthorized')) {
      throw error;
    }
    throw new Error(`Failed to update box availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

