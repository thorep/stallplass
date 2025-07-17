import { prisma } from '@/lib/prisma';
import { Stable, Amenity, Box } from '@prisma/client';
import { StableWithBoxStats } from '@/types/stable';
import { getTotalBoxesCount, getAvailableBoxesCount, getBoxPriceRange } from './box-service';
import { ensureUserExists } from './user-service';

export type StableWithAmenities = Stable & {
  amenities: {
    amenity: Amenity;
  }[];
  boxes?: (Box & {
    amenities: {
      amenity: Amenity;
    }[];
  })[];
  owner: {
    name: string | null;
    email: string;
  };
};

export type CreateStableData = {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  county?: string;
  images: string[];
  amenityIds: string[]; // Array of amenity IDs
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  featured?: boolean;
};

export type UpdateStableData = Partial<Omit<CreateStableData, 'ownerId'>>;

/**
 * Get all stables with amenities and boxes
 */
export async function getAllStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  return await prisma.stable.findMany({
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      ...(includeBoxes && {
        boxes: {
          include: {
            amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      }),
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' }
    ]
  }) as unknown as StableWithAmenities[];
}

/**
 * Get all stables with box statistics for listings
 */
export async function getAllStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  const stables = await getAllStables();
  
  const stablesWithStats = await Promise.all(
    stables.map(async (stable) => {
      const totalBoxes = await getTotalBoxesCount(stable.id);
      const availableBoxes = await getAvailableBoxesCount(stable.id);
      const priceRange = await getBoxPriceRange(stable.id) || { min: 0, max: 0 };

      return {
        ...stable,
        totalBoxes,
        availableBoxes,
        priceRange
      };
    })
  );

  return stablesWithStats as StableWithBoxStats[];
}

/**
 * Get stables by owner with amenities
 */
export async function getStablesByOwner(ownerId: string): Promise<StableWithAmenities[]> {
  return await prisma.stable.findMany({
    where: { ownerId },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get stable by ID with amenities
 */
export async function getStableById(id: string): Promise<StableWithAmenities | null> {
  return await prisma.stable.findUnique({
    where: { id },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Create a new stable with amenities
 */
export async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  // Generate location from address components
  const location = `${data.address}, ${data.city}`;
  
  // Ensure user exists in database
  await ensureUserExists({
    firebaseId: data.ownerId,
    email: data.ownerEmail,
    name: data.ownerName
  });
  
  return await prisma.stable.create({
    data: {
      name: data.name,
      description: data.description,
      location: location,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      county: data.county,
      images: data.images,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      featured: data.featured ?? false,
      amenities: {
        create: data.amenityIds.map(amenityId => ({
          amenityId
        }))
      }
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Update a stable and its amenities
 */
export async function updateStable(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  // Handle amenity updates separately if provided
  if (data.amenityIds) {
    // Remove existing amenity relationships
    await prisma.stableAmenity.deleteMany({
      where: { stableId: id }
    });
    
    // Add new amenity relationships
    await prisma.stableAmenity.createMany({
      data: data.amenityIds.map(amenityId => ({
        stableId: id,
        amenityId
      }))
    });
  }

  // Update the stable data (excluding amenityIds)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { amenityIds, ...updateData } = data;
  
  return await prisma.stable.update({
    where: { id },
    data: updateData,
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Delete a stable
 */
export async function deleteStable(id: string): Promise<void> {
  await prisma.stable.delete({
    where: { id }
  });
}

export interface StableSearchFilters {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  hasAvailableBoxes?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
}

/**
 * Search stables by aggregating box criteria
 * If ANY box in a stable matches the criteria, include the stable
 */
export async function searchStables(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  const {
    query,
    location,
    minPrice,
    maxPrice,
    amenityIds,
    hasAvailableBoxes,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize
  } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Text search on stable info
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Location filter
  if (location) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { location: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } },
          { city: { contains: location, mode: 'insensitive' } }
        ]
      }
    ];
  }

  // Box-level filters - show stable if ANY box matches
  const boxFilters: Record<string, unknown> = {};
  
  if (hasAvailableBoxes) {
    boxFilters.isAvailable = true;
  }
  
  if (isIndoor !== undefined) {
    boxFilters.isIndoor = isIndoor;
  }
  
  if (hasWindow !== undefined) {
    boxFilters.hasWindow = hasWindow;
  }
  
  if (hasElectricity !== undefined) {
    boxFilters.hasElectricity = hasElectricity;
  }
  
  if (hasWater !== undefined) {
    boxFilters.hasWater = hasWater;
  }
  
  if (maxHorseSize) {
    boxFilters.maxHorseSize = maxHorseSize;
  }

  // Price range filter - show stable if ANY box is in price range
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = minPrice;
    if (maxPrice) priceFilter.lte = maxPrice;
    boxFilters.price = priceFilter;
  }

  // If we have box-level filters, add them
  if (Object.keys(boxFilters).length > 0) {
    where.boxes = {
      some: boxFilters
    };
  }

  // Amenity filters - combine stable and box amenities
  if (amenityIds && amenityIds.length > 0) {
    // Show stable if it has amenities OR any of its boxes have amenities
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          // Stable has the amenities
          {
            amenities: {
              some: {
                amenityId: { in: amenityIds }
              }
            }
          },
          // OR any box has the amenities
          {
            boxes: {
              some: {
                amenities: {
                  some: {
                    amenityId: { in: amenityIds }
                  }
                }
              }
            }
          }
        ]
      }
    ];
  }

  return await prisma.stable.findMany({
    where,
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

/**
 * Get featured stables
 */
export async function getFeaturedStables(): Promise<StableWithAmenities[]> {
  return await prisma.stable.findMany({
    where: { featured: true },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  });
}

/**
 * Get stables that have specific amenities
 */
export async function getStablesByAmenities(amenityIds: string[]): Promise<StableWithAmenities[]> {
  return await prisma.stable.findMany({
    where: {
      amenities: {
        some: {
          amenityId: { in: amenityIds }
        }
      }
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}