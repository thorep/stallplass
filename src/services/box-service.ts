/**
 * Box service for managing stable box data and operations
 * Handles CRUD operations for boxes, their amenities, and availability status
 */

import { prisma } from './prisma';
import { Box, BoxWithStablePreview } from '@/types/stable';
import type { Prisma, box_amenities, boxes } from '@/generated/prisma';
import { getKampanjeFlag } from '../app/actions/flags';

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
  isAvailable?: boolean;
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
}

/**
 * Create a new box (server-side with elevated permissions)
 */
export async function createBoxServer(data: CreateBoxData): Promise<Box> {
  const { amenityIds, ...boxData } = data;

  try {
    // Check kampanje flag for auto-activation of advertising
    const isKampanjeActive = await getKampanjeFlag();
    
    // If kampanje is active, auto-activate advertising for 6 months
    let advertisingData = {};
    if (isKampanjeActive) {
      const now = new Date();
      const sixMonthsLater = new Date(now);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      
      advertisingData = {
        advertisingActive: true,
        advertisingStartDate: now,
        advertisingEndDate: sixMonthsLater
      };
    }

    const box = await prisma.boxes.create({
      data: {
        ...boxData,
        ...advertisingData,
        isAvailable: boxData.isAvailable ?? true,
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
    console.error('updateBox service error:', error);
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
        advertisingDaysRemaining: getDaysRemaining(box.advertisingEndDate),
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

    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (maxHorseSize) where.maxHorseSize = maxHorseSize;
    if (minPrice !== undefined) {
      where.price = { ...where.price as object, gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price as object, lte: maxPrice };
    }

    // Handle amenity filtering - find boxes that have ALL selected amenities
    if (amenityIds && amenityIds.length > 0) {
      where.box_amenity_links = {
        some: {
          amenityId: {
            in: amenityIds
          }
        }
      };

      // For AND logic (all amenities must be present), we need to check count
      const boxesWithAmenities = await prisma.boxes.findMany({
        where: {
          stableId: stable_id,
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
      const validBoxIds = boxesWithAmenities
        .filter(box => box.box_amenity_links.length === amenityIds.length)
        .map(box => box.id);

      if (validBoxIds.length === 0) {
        return [];
      }

      where.id = { in: validBoxIds };
      delete where.box_amenity_links; // Remove the previous filter
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
        { isAvailable: 'desc' },
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
    amenityIds
  } = filters;

  try {
    const now = new Date();
    
    // Build base where clause - only show boxes with active advertising and not archived
    const where: Prisma.boxesWhereInput = {
      advertisingActive: true,
      advertisingEndDate: { gt: now },
      archived: false
    };

    if (stableId) where.stableId = stableId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (maxHorseSize) where.maxHorseSize = maxHorseSize;
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
      where.isAvailable = true;
    } else if (occupancyStatus === 'occupied') {
      // Only show occupied boxes (not available)
      where.isAvailable = false;
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
        { isAvailable: 'desc' },
        { price: 'asc' }
      ]
    });

    // Query completed
    if (boxes && boxes.length > 0) {
      // Found boxes
    }

    // Transform to match expected BoxWithStablePreview type
    return boxes.map(box => {
      const transformedBox: BoxWithStablePreview = {
        ...box,
        amenities: box.box_amenity_links.map((link) => ({
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
        isAvailable: true,
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
    // First check if the box is advertised and available for sponsored placement
    const box = await prisma.boxes.findUnique({
      where: { id: boxId },
      include: {
        stables: true
      }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    if (!box.advertisingActive) {
      throw new Error('Box must have active advertising to purchase sponsored placement');
    }

    const now = new Date();
    const advertisingEndDate = box.advertisingEndDate;
    let maxDaysAvailable = days;

    if (advertisingEndDate) {
      const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      maxDaysAvailable = Math.min(days, daysUntilAdvertisingEnds);
    }

    if (maxDaysAvailable <= 0) {
      throw new Error('No days available for sponsored placement');
    }

    // If box is already sponsored, extend from current end date
    const sponsoredUntil = box.sponsoredUntil ? new Date(box.sponsoredUntil) : null;
    const startDate = box.isSponsored && sponsoredUntil && sponsoredUntil > now 
      ? sponsoredUntil 
      : now;

    const endDate = new Date(startDate.getTime() + (maxDaysAvailable * 24 * 60 * 60 * 1000));

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

    // Calculate maximum days available for new/extended sponsorship based on box's advertising
    if (box.advertisingActive && box.advertisingEndDate) {
      const advertisingEndDate = new Date(box.advertisingEndDate);
      const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      maxDaysAvailable = Math.max(0, daysUntilAdvertisingEnds - daysRemaining);
    }

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
 * Update box availability date
 */
export async function updateBoxAvailabilityDate(
  boxId: string,
  userId: string,
  availabilityDate: string | null
): Promise<Box> {
  try {
    // First verify the box exists and belongs to the user
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

    // Convert date string to Date object or null
    const dateValue = availabilityDate ? new Date(availabilityDate) : null;

    // Update the box
    const updatedBox = await prisma.boxes.update({
      where: { id: boxId },
      data: {
        availabilityDate: dateValue,
        updatedAt: new Date()
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
    throw new Error(`Failed to update box availability date: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update box availability status (for rental management)
 */
export async function updateBoxAvailability(
  boxId: string,
  userId: string,
  isAvailable: boolean
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
        isAvailable,
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

/**
 * Purchase advertising for a box
 */
export async function purchaseBoxAdvertising(boxId: string, months: number): Promise<Box> {
  try {
    const box = await prisma.boxes.findUnique({
      where: { id: boxId }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    const now = new Date();
    
    // Calculate end date
    let endDate = new Date(now);
    
    // If box already has active advertising, extend from current end date
    if (box.advertisingActive && box.advertisingEndDate && box.advertisingEndDate > now) {
      endDate = new Date(box.advertisingEndDate);
    }
    
    endDate.setMonth(endDate.getMonth() + months);

    // Update the box with advertising
    const updatedBox = await prisma.boxes.update({
      where: { id: boxId },
      data: {
        advertisingActive: true,
        advertisingStartDate: box.advertisingActive ? box.advertisingStartDate : now,
        advertisingEndDate: endDate
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
    throw new Error(`Failed to purchase box advertising: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get advertising info for a box
 */
export async function getBoxAdvertisingInfo(boxId: string): Promise<{
  isActive: boolean;
  advertisingEndDate: Date | null;
  daysRemaining: number;
}> {
  try {
    const box = await prisma.boxes.findUnique({
      where: { id: boxId }
    });

    if (!box) {
      throw new Error('Box not found');
    }

    const now = new Date();
    let daysRemaining = 0;

    // Calculate days remaining for current advertising
    if (box.advertisingActive && box.advertisingEndDate && box.advertisingEndDate > now) {
      daysRemaining = Math.ceil((box.advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      isActive: box.advertisingActive && box.advertisingEndDate !== null && box.advertisingEndDate > now,
      advertisingEndDate: box.advertisingEndDate,
      daysRemaining
    };
  } catch (error) {
    throw new Error(`Failed to get box advertising info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

