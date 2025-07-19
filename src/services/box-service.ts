/**
 * Box service for managing stable box data and operations
 * Handles CRUD operations for boxes, their amenities, and availability status
 */

import { prisma } from '@/lib/prisma';
import { Box, BoxWithStable } from '@/types/stable';

export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  boxType?: 'BOKS' | 'UTEGANG';
  isAvailable?: boolean;
  isActive?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  stableId: string;
  amenityIds?: string[];
}

export interface UpdateBoxData extends Partial<CreateBoxData> {
  id: string;
}

export interface BoxFilters {
  stableId?: string;
  isAvailable?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied'; // New occupancy filter
  minPrice?: number;
  maxPrice?: number;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  amenityIds?: string[];
}

/**
 * Create a new box
 */
export async function createBox(data: CreateBoxData): Promise<Box> {
  const { amenityIds, ...boxData } = data;

  const box = await prisma.box.create({
    data: {
      ...boxData,
      ...(amenityIds && {
        amenities: {
          create: amenityIds.map(amenityId => ({
            amenityId
          }))
        }
      })
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    }
  });

  return box as Box;
}

/**
 * Update an existing box
 */
export async function updateBox(data: UpdateBoxData): Promise<Box> {
  const { id, amenityIds, ...updateData } = data;

  // If amenities are being updated, first delete existing ones
  if (amenityIds !== undefined) {
    await prisma.boxAmenityLink.deleteMany({
      where: { boxId: id }
    });
  }

  const box = await prisma.box.update({
    where: { id },
    data: {
      ...updateData,
      ...(amenityIds && {
        amenities: {
          create: amenityIds.map(amenityId => ({
            amenityId
          }))
        }
      })
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    }
  });

  return box as Box;
}

/**
 * Delete a box
 */
export async function deleteBox(id: string): Promise<void> {
  await prisma.box.delete({
    where: { id }
  });
}

/**
 * Get a single box by ID
 */
export async function getBoxById(id: string): Promise<Box | null> {
  const box = await prisma.box.findUnique({
    where: { id },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    }
  });

  return box as Box | null;
}

/**
 * Get a box with stable information
 */
export async function getBoxWithStable(id: string): Promise<BoxWithStable | null> {
  const box = await prisma.box.findUnique({
    where: { id },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      stable: {
        select: {
          id: true,
          name: true,
          location: true,
          ownerName: true,
          rating: true,
          reviewCount: true,
          images: true,
          imageDescriptions: true
        }
      }
    }
  });

  return box as BoxWithStable | null;
}

/**
 * Get all boxes for a stable
 */
export async function getBoxesByStableId(stableId: string): Promise<Box[]> {
  const boxes = await prisma.box.findMany({
    where: { stableId },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return boxes as Box[];
}

/**
 * Search boxes within a specific stable
 */
export async function searchBoxesInStable(stableId: string, filters: Omit<BoxFilters, 'stableId'> = {}): Promise<Box[]> {
  const {
    isAvailable,
    minPrice,
    maxPrice,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize,
    amenityIds
  } = filters;

  const whereClause: Record<string, unknown> = {
    stableId // Always filter by stable
  };

  if (isAvailable !== undefined) whereClause.isAvailable = isAvailable;
  if (isIndoor !== undefined) whereClause.isIndoor = isIndoor;
  if (hasWindow !== undefined) whereClause.hasWindow = hasWindow;
  if (hasElectricity !== undefined) whereClause.hasElectricity = hasElectricity;
  if (hasWater !== undefined) whereClause.hasWater = hasWater;
  if (maxHorseSize) whereClause.maxHorseSize = maxHorseSize;

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = minPrice;
    if (maxPrice) priceFilter.lte = maxPrice;
    whereClause.price = priceFilter;
  }

  if (amenityIds && amenityIds.length > 0) {
    whereClause.amenities = {
      some: {
        amenityId: {
          in: amenityIds
        }
      }
    };
  }

  const boxes = await prisma.box.findMany({
    where: whereClause,
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    },
    orderBy: [
      { isSponsored: 'desc' }, // Sponsored boxes first
      { isAvailable: 'desc' },
      { price: 'asc' },
      { name: 'asc' }
    ]
  });

  return boxes as Box[];
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
export async function searchBoxes(filters: BoxFilters = {}): Promise<BoxWithStable[]> {
  // First update any expired sponsored boxes (fallback if cron doesn't work)
  await updateExpiredSponsoredBoxes();
  const {
    stableId,
    isAvailable,
    occupancyStatus,
    minPrice,
    maxPrice,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize,
    amenityIds
  } = filters;

  const whereClause: Record<string, unknown> = {
    stable: {
      advertisingActive: true // Only include boxes from stables with active advertising
    }
  };

  if (stableId) whereClause.stableId = stableId;
  if (isAvailable !== undefined) whereClause.isAvailable = isAvailable;
  if (isIndoor !== undefined) whereClause.isIndoor = isIndoor;
  if (hasWindow !== undefined) whereClause.hasWindow = hasWindow;
  if (hasElectricity !== undefined) whereClause.hasElectricity = hasElectricity;
  if (hasWater !== undefined) whereClause.hasWater = hasWater;
  if (maxHorseSize) whereClause.maxHorseSize = maxHorseSize;

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = minPrice;
    if (maxPrice) priceFilter.lte = maxPrice;
    whereClause.price = priceFilter;
  }

  if (amenityIds && amenityIds.length > 0) {
    whereClause.amenities = {
      some: {
        amenityId: {
          in: amenityIds
        }
      }
    };
  }

  // Occupancy status filtering based on active rentals
  if (occupancyStatus === 'available') {
    whereClause.rentals = {
      none: {
        status: 'ACTIVE'
      }
    };
  } else if (occupancyStatus === 'occupied') {
    whereClause.rentals = {
      some: {
        status: 'ACTIVE'
      }
    };
  }
  // 'all' or undefined means no occupancy filtering

  const boxes = await prisma.box.findMany({
    where: whereClause,
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      stable: {
        select: {
          id: true,
          name: true,
          location: true,
          ownerName: true,
          rating: true,
          reviewCount: true,
          images: true,
          imageDescriptions: true
        }
      }
    },
    orderBy: [
      { isSponsored: 'desc' }, // Sponsored boxes first
      { isAvailable: 'desc' },
      { price: 'asc' }
    ]
  });

  return boxes as BoxWithStable[];
}

/**
 * Get available boxes count for a stable
 */
export async function getAvailableBoxesCount(stableId: string): Promise<number> {
  return await prisma.box.count({
    where: {
      stableId,
      isAvailable: true
    }
  });
}

/**
 * Get total boxes count for a stable
 */
export async function getTotalBoxesCount(stableId: string): Promise<number> {
  return await prisma.box.count({
    where: { stableId }
  });
}

/**
 * Get price range for boxes in a stable
 */
export async function getBoxPriceRange(stableId: string): Promise<{ min: number; max: number } | null> {
  const result = await prisma.box.aggregate({
    where: { stableId },
    _min: { price: true },
    _max: { price: true }
  });

  if (result._min.price === null || result._max.price === null) {
    return null;
  }

  return {
    min: result._min.price,
    max: result._max.price
  };
}

/**
 * Purchase sponsored placement for a box
 */
export async function purchaseSponsoredPlacement(boxId: string, days: number): Promise<Box> {
  // First check if the box is active and available for advertising
  const box = await prisma.box.findUnique({
    where: { id: boxId },
    include: {
      stable: {
        select: {
          advertisingActive: true,
          advertisingEndDate: true
        }
      }
    }
  });

  if (!box) {
    throw new Error('Box not found');
  }

  if (!box.stable.advertisingActive) {
    throw new Error('Stable advertising must be active to purchase sponsored placement');
  }

  // Calculate the maximum days available (limited by stable advertising end date)
  const now = new Date();
  const advertisingEndDate = box.stable.advertisingEndDate;
  let maxDaysAvailable = days;

  if (advertisingEndDate) {
    const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    maxDaysAvailable = Math.min(days, daysUntilAdvertisingEnds);
  }

  if (maxDaysAvailable <= 0) {
    throw new Error('No days available for sponsored placement');
  }

  // If box is already sponsored, extend from current end date
  const startDate = box.isSponsored && box.sponsoredUntil && box.sponsoredUntil > now 
    ? box.sponsoredUntil 
    : now;

  const endDate = new Date(startDate.getTime() + (maxDaysAvailable * 24 * 60 * 60 * 1000));

  const updatedBox = await prisma.box.update({
    where: { id: boxId },
    data: {
      isSponsored: true,
      sponsoredStartDate: box.isSponsored && box.sponsoredStartDate ? box.sponsoredStartDate : now,
      sponsoredUntil: endDate
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      }
    }
  });

  return updatedBox as Box;
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
  const box = await prisma.box.findUnique({
    where: { id: boxId },
    include: {
      stable: {
        select: {
          advertisingActive: true,
          advertisingEndDate: true
        }
      }
    }
  });

  if (!box) {
    throw new Error('Box not found');
  }

  const now = new Date();
  let daysRemaining = 0;
  let maxDaysAvailable = 0;

  // Calculate days remaining for current sponsorship
  if (box.isSponsored && box.sponsoredUntil && box.sponsoredUntil > now) {
    daysRemaining = Math.ceil((box.sponsoredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate maximum days available for new/extended sponsorship
  if (box.stable.advertisingActive && box.stable.advertisingEndDate) {
    const daysUntilAdvertisingEnds = Math.ceil((box.stable.advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    maxDaysAvailable = Math.max(0, daysUntilAdvertisingEnds - daysRemaining);
  }

  return {
    isSponsored: box.isSponsored,
    sponsoredUntil: box.sponsoredUntil,
    daysRemaining,
    maxDaysAvailable
  };
}