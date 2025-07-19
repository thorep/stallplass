import { prisma } from '@/lib/prisma';
import { StableWithBoxStats } from '@/types/stable';
import { StableWithAmenities, CreateStableData, UpdateStableData, StableSearchFilters } from '@/types/services';
import { ensureUserExists } from './user-service';

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
 * Get all publicly visible stables (only those with active boxes)
 */
export async function getPublicStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  const boxWhere = includeBoxes ? {
    boxes: {
      include: {
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    }
  } : {};

  return await prisma.stable.findMany({
    where: {
      advertisingActive: true
    },
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      ...boxWhere,
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
  const stables = await prisma.stable.findMany({
    include: {
      amenities: {
        include: {
          amenity: true
        }
      },
      boxes: {
        include: {
          amenities: {
            include: {
              amenity: true
            }
          }
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

  // Calculate box statistics directly from the included boxes
  const stablesWithStats = stables.map(stable => {
    // If stable advertising is active, all boxes are considered "active"
    const allBoxes = stable.boxes || [];
    const availableBoxes = allBoxes.filter(box => box.isAvailable);
    const prices = allBoxes.map(box => box.price).filter(price => price > 0);
    
    const totalBoxes = allBoxes.length;
    const availableBoxesCount = availableBoxes.length;
    const priceRange = prices.length > 0 
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: 0, max: 0 };

    return {
      ...stable,
      totalBoxes,
      availableBoxes: availableBoxesCount,
      priceRange
    };
  });

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
 * Get stable by ID with amenities and boxes
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
      boxes: {
        include: {
          amenities: {
            include: {
              amenity: true
            }
          }
        }
      },
      faqs: {
        where: {
          isActive: true
        },
        orderBy: {
          sortOrder: 'asc'
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
      totalBoxes: data.totalBoxes,
      location: location,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      county: data.county,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      imageDescriptions: data.imageDescriptions || [],
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
    await prisma.stableAmenityLink.deleteMany({
      where: { stableId: id }
    });
    
    // Add new amenity relationships
    await prisma.stableAmenityLink.createMany({
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
  // Delete in proper order to avoid foreign key constraint issues
  await prisma.$transaction(async (tx) => {
    // Delete all rentals for this stable
    await tx.rental.deleteMany({
      where: { stableId: id }
    });
    
    // Delete all conversations for this stable
    await tx.conversation.deleteMany({
      where: { stableId: id }
    });
    
    // Delete all boxes for this stable (this will cascade to box amenities)
    await tx.box.deleteMany({
      where: { stableId: id }
    });
    
    // Delete stable amenity links
    await tx.stableAmenityLink.deleteMany({
      where: { stableId: id }
    });
    
    // Finally delete the stable itself
    await tx.stable.delete({
      where: { id }
    });
  });
}

// StableSearchFilters now imported from types

/**
 * Search stables by aggregating box criteria
 * If ANY box in a stable matches the criteria, include the stable
 */
export async function searchStables(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  const {
    query,
    location: locationFilter,
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
  if (locationFilter) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { location: { contains: locationFilter, mode: 'insensitive' } },
          { address: { contains: locationFilter, mode: 'insensitive' } },
          { city: { contains: locationFilter, mode: 'insensitive' } }
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