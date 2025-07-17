import { prisma } from '@/lib/prisma';
import { Stable, Amenity } from '@prisma/client';

export type StableWithAmenities = Stable & {
  amenities: {
    amenity: Amenity;
  }[];
  owner: {
    name: string | null;
    email: string;
  };
};

export type CreateStableData = {
  name: string;
  description: string;
  location: string;
  price: number;
  availableSpaces: number;
  totalSpaces: number;
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
 * Get all stables with amenities
 */
export async function getAllStables(): Promise<StableWithAmenities[]> {
  return await prisma.stable.findMany({
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
  return await prisma.stable.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      price: data.price,
      availableSpaces: data.availableSpaces,
      totalSpaces: data.totalSpaces,
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

/**
 * Search stables by query and filter by amenities
 */
export async function searchStables(
  query?: string,
  amenityIds?: string[],
  minPrice?: number,
  maxPrice?: number,
  location?: string
): Promise<StableWithAmenities[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Location filter
  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  // Amenity filter - must have ALL selected amenities
  if (amenityIds && amenityIds.length > 0) {
    where.amenities = {
      some: {
        amenityId: { in: amenityIds }
      }
    };
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