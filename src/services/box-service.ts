import { prisma } from '@/lib/prisma';
import { Box, BoxWithStable } from '@/types/stable';

export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  isAvailable?: boolean;
  isActive?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasDoor?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  stableId: string;
  amenityIds?: string[];
}

export interface UpdateBoxData extends Partial<CreateBoxData> {
  id: string;
}

export interface BoxFilters {
  stableId?: string;
  isAvailable?: boolean;
  isActive?: boolean;
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
          ownerPhone: true,
          ownerEmail: true
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
    isActive,
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
  if (isActive !== undefined) whereClause.isActive = isActive;
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
      { isAvailable: 'desc' },
      { price: 'asc' },
      { name: 'asc' }
    ]
  });

  return boxes as Box[];
}

/**
 * Search boxes with filters across all stables
 */
export async function searchBoxes(filters: BoxFilters = {}): Promise<BoxWithStable[]> {
  const {
    stableId,
    isAvailable,
    isActive,
    minPrice,
    maxPrice,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize,
    amenityIds
  } = filters;

  const whereClause: Record<string, unknown> = {};

  if (stableId) whereClause.stableId = stableId;
  if (isAvailable !== undefined) whereClause.isAvailable = isAvailable;
  if (isActive !== undefined) whereClause.isActive = isActive;
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
      },
      stable: {
        select: {
          id: true,
          name: true,
          location: true,
          ownerName: true,
          ownerPhone: true,
          ownerEmail: true
        }
      }
    },
    orderBy: [
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