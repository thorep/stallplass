import { prisma } from './prisma';
import { Prisma, box_amenities } from '@/generated/prisma';
import { StableWithBoxStats } from '@/types/stable';
import { StableWithAmenities, CreateStableData, UpdateStableData, StableSearchFilters } from '@/types/services';
// No logging in client-accessible services

// Helper function to calculate days remaining
function getDaysRemaining(endDate: Date | string | null): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Type for box with amenity links from Prisma query
type BoxWithAmenityLinks = {
  box_amenity_links: {
    box_amenities: box_amenities;
  }[];
};

/**
 * Get all stables with amenities and boxes
 */
export async function getAllStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  try {
    const stables = await prisma.stables.findMany({
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        },
        ...(includeBoxes && {
          boxes: {
            include: {
              box_amenity_links: {
                include: {
                  box_amenities: true
                }
              }
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match expected type structure
    return stables.map(stable => ({
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users,
      ...(includeBoxes && stable.boxes && {
        boxes: stable.boxes.map(box => ({
          ...box,
          amenities: (box as typeof box & BoxWithAmenityLinks).box_amenity_links?.map((link) => ({
            amenity: link.box_amenities
          })) || []
        }))
      })
    })) as unknown as StableWithAmenities[];
  } catch (error) {
    throw new Error(`Error fetching stables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all publicly visible stables (only those with active advertising)
 */
export async function getPublicStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  try {
    const stables = await prisma.stables.findMany({
      where: {
        // All stables are now publicly visible - no advertisingActive field
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        },
        ...(includeBoxes && {
          boxes: {
            include: {
              box_amenity_links: {
                include: {
                  box_amenities: true
                }
              }
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match expected type structure
    return stables.map(stable => ({
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users,
      ...(includeBoxes && stable.boxes && {
        boxes: stable.boxes.map(box => ({
          ...box,
          amenities: (box as typeof box & BoxWithAmenityLinks).box_amenity_links?.map((link) => ({
            amenity: link.box_amenities
          })) || []
        }))
      })
    })) as unknown as StableWithAmenities[];
  } catch (error) {
    throw new Error(`Error fetching public stables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all stables with box statistics for listings
 */
export async function getAllStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  try {
    const stables = await prisma.stables.findMany({
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        boxes: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            size: true,
            isAvailable: true,
            maxHorseSize: true,
            specialNotes: true,
            images: true,
            createdAt: true,
            updatedAt: true,
            stableId: true,
            imageDescriptions: true,
            isSponsored: true,
            sponsoredStartDate: true,
            sponsoredUntil: true,
            boxType: true,
            advertisingActive: true,
            advertisingStartDate: true,
            advertisingEndDate: true,
            box_amenity_links: {
              include: {
                box_amenities: true
              }
            }
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate box statistics directly from the included boxes
    const stablesWithStats = stables.map(stable => {
      const allBoxes = stable.boxes || [];
      const availableBoxes = allBoxes.filter(box => box.isAvailable);
      const prices = allBoxes.map(box => box.price).filter(price => price > 0);
      
      const totalBoxes = allBoxes.length;
      const availableBoxCount = availableBoxes.length;
      const priceRange = prices.length > 0 
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };

      return {
        ...stable,
        amenities: stable.stable_amenity_links.map(link => ({
          amenity: link.stable_amenities
        })),
        boxes: stable.boxes.map(box => ({
          ...box,
          amenities: (box as typeof box & BoxWithAmenityLinks).box_amenity_links?.map((link) => ({
            amenity: link.box_amenities
          })) || [],
          advertisingDaysRemaining: getDaysRemaining(box.advertisingEndDate),
          boostDaysRemaining: getDaysRemaining(box.sponsoredUntil)
        })),
        owner: stable.users,
        totalBoxes,
        availableBoxes: availableBoxCount,
        priceRange
      };
    });

    return stablesWithStats as StableWithBoxStats[];
  } catch (error) {
    throw new Error(`Error fetching stables with box statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hent stables etter eier med fasiliteter
 * Get stables by owner with amenities
 */
export async function getStablesByOwner(ownerId: string): Promise<StableWithBoxStats[]> {
  try {
    // Full query with relations including boxes for statistics
    const stables = await prisma.stables.findMany({
      where: {
        ownerId: ownerId
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        counties: true,
        municipalities: true,
        boxes: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            size: true,
            isAvailable: true,
            maxHorseSize: true,
            specialNotes: true,
            images: true,
            createdAt: true,
            updatedAt: true,
            stableId: true,
            imageDescriptions: true,
            isSponsored: true,
            sponsoredStartDate: true,
            sponsoredUntil: true,
            boxType: true,
            advertisingActive: true,
            advertisingStartDate: true,
            advertisingEndDate: true,
            box_amenity_links: {
              include: {
                box_amenities: true
              }
            }
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate box statistics directly from the included boxes
    const stablesWithStats = stables.map(stable => {
      const allBoxes = stable.boxes || [];
      const availableBoxes = allBoxes.filter(box => box.isAvailable);
      const prices = allBoxes.map(box => box.price).filter(price => price > 0);
      
      const totalBoxes = allBoxes.length;
      const availableBoxCount = availableBoxes.length;
      const priceRange = prices.length > 0 
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };

      return {
        ...stable,
        amenities: stable.stable_amenity_links.map(link => ({
          amenity: link.stable_amenities
        })),
        boxes: stable.boxes.map(box => ({
          ...box,
          amenities: (box as typeof box & BoxWithAmenityLinks).box_amenity_links?.map((link) => ({
            amenity: link.box_amenities
          })) || [],
          advertisingDaysRemaining: getDaysRemaining(box.advertisingEndDate),
          boostDaysRemaining: getDaysRemaining(box.sponsoredUntil)
        })),
        owner: stable.users,
        totalBoxes,
        availableBoxes: availableBoxCount,
        priceRange
      };
    });

    return stablesWithStats as StableWithBoxStats[];
  } catch (error) {
    throw new Error(`Error fetching stables by owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get stable by ID with amenities and boxes
 */
export async function getStableById(id: string): Promise<StableWithAmenities | null> {
  try {
    const stable = await prisma.stables.findUnique({
      where: { id },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        boxes: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            size: true,
            isAvailable: true,
            maxHorseSize: true,
            specialNotes: true,
            images: true,
            createdAt: true,
            updatedAt: true,
            stableId: true,
            imageDescriptions: true,
            isSponsored: true,
            sponsoredStartDate: true,
            sponsoredUntil: true,
            boxType: true,
            advertisingActive: true,
            advertisingStartDate: true,
            advertisingEndDate: true,
            box_amenity_links: {
              include: {
                box_amenities: true
              }
            }
          }
        },
        stable_faqs: {
          where: {
            isActive: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!stable) {
      return null;
    }

    // Transform to match expected type structure
    return {
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      boxes: stable.boxes.map(box => ({
        ...box,
        amenities: (box as typeof box & BoxWithAmenityLinks).box_amenity_links?.map((link) => ({
          amenity: link.box_amenities
        })) || []
      })),
      faqs: stable.stable_faqs,
      owner: stable.users
    } as unknown as StableWithAmenities;
  } catch (error) {
    throw new Error(`Error fetching stable by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new stable with amenities
 */
export async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  // Creating stable
  
  // Processing data keys

  // Map kommune number to countyId and municipalityId if available
  let countyId = data.countyId || null;
  let municipalityId = data.municipalityId || null;
  
  // Always do the lookup if we have a kommuneNumber to ensure we get the IDs
  if (data.kommuneNumber) {
    console.log('Looking up municipality with kommuneNumber:', data.kommuneNumber);
    // Attempting location lookup
    try {
      // Use Prisma for location lookup
      const municipalityData = await prisma.municipalities.findFirst({
        where: {
          municipalityNumber: data.kommuneNumber
        },
        include: {
          counties: true
        }
      });

      console.log('Municipality lookup result:', municipalityData);
      if (municipalityData) {
        // Found municipality data
        
        // Always use the lookup results to ensure we have the IDs
        countyId = municipalityData.countyId;
        municipalityId = municipalityData.id;
        console.log('Setting location IDs:', { countyId, municipalityId });
        
        // Setting location IDs
      } else {
        console.log('Municipality not found for kommuneNumber:', data.kommuneNumber);
        // Municipality not found
      }
      
      // Final location values set
    } catch {
      // Failed to map location IDs
      // Continue with stable creation even if location mapping fails
    }
  }

  console.log('Final location values before saving:', { countyId, municipalityId });
  
  try {
    // Create stable with amenities in a single transaction-like operation  
    const stable = await prisma.stables.create({
      data: {
        name: data.name,
        description: data.description,
        totalBoxes: data.totalBoxes,
        address: data.address,
        postalCode: data.postnummer, // From API response
        postalPlace: data.poststed,  // From API response
        countyId: countyId,
        municipalityId: municipalityId,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images,
        imageDescriptions: data.imageDescriptions || [],
        ownerId: data.ownerId,
        updatedAt: new Date(),
        // Add amenity links if provided
        ...(data.amenityIds && data.amenityIds.length > 0 && {
          stable_amenity_links: {
            create: data.amenityIds.map(amenityId => ({
              amenityId
            }))
          }
        })
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Successfully created stable

    // Transform to match expected type structure
    return {
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users
    } as unknown as StableWithAmenities;
  } catch (error) {
    // Error creating stable
    throw new Error(`Error creating stable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a stable and its amenities
 */
export async function updateStable(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  try {
    // Extract amenityIds and prepare update data
    const { amenityIds, ...updateData } = data;
    
    const updatedStable = await prisma.stables.update({
      where: { id },
      data: {
        ...updateData,
        // Handle amenity updates if provided
        ...(amenityIds !== undefined && {
          stable_amenity_links: {
            deleteMany: {}, // Delete all existing links
            create: amenityIds.map(amenityId => ({
              amenityId
            }))
          }
        })
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Transform to match expected type structure
    return {
      ...updatedStable,
      amenities: updatedStable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: updatedStable.users
    } as unknown as StableWithAmenities;
  } catch (error) {
    throw new Error(`Error updating stable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a stable
 */
export async function deleteStable(id: string): Promise<void> {
  try {
    // With Prisma's cascade delete configured in the schema,
    // deleting the stable should cascade delete related records
    await prisma.stables.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error(`Error deleting stable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Søk stables ved å aggregere stallplasskriterier
 * Hvis NOEN stallplass i en stall matcher kriteriene, inkluder stallen
 * Search stables by aggregating box criteria
 */
export async function searchStables(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  try {
    const {
      query,
      fylkeId,
      kommuneId,
      minPrice,
      maxPrice,
      amenityIds,
      hasAvailableBoxes,
      isIndoor: erInnendors,
      hasWindow: harVindu,
      hasElectricity: harStrom,
      hasWater: harVann,
      maxHorseSize: maksHestestorrelse
    } = filters;

    // Start building the where clause for stables
    const whereClause: Prisma.stablesWhereInput = {
      // TODO: Add advertisingActive field to stables schema
      // Only show publicly advertised stables - temporarily commented out
      // advertisingActive: true
    };

    // Tekstsøk på stallinfo (Text search on stable info)
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Fylke and kommune filters (County and municipality filters)
    if (fylkeId) {
      whereClause.countyId = fylkeId;
    }
    
    if (kommuneId) {
      whereClause.municipalityId = kommuneId;
    }

    // For stallplassnivå- og prisfilters trenger vi å sjekke om NOEN stallplass matcher
    // Dette krever en underforespørselstilnærming
    // (For box-level and price filters we need to check if ANY box matches the criteria)
    if (hasAvailableBoxes || erInnendors !== undefined || harVindu !== undefined || 
        harStrom !== undefined || harVann !== undefined || maksHestestorrelse || 
        minPrice || maxPrice) {
      
      // Bygg stallplassfilterkriterier (Build box filter criteria)
      const boxWhereClause: Prisma.boxesWhereInput = {};
      
      if (hasAvailableBoxes) {
        boxWhereClause.isAvailable = true;
      }
      
      // TODO: Add these fields to boxes schema or handle via amenities
      // Temporarily commented out missing fields
      // if (erInnendors !== undefined) {
      //   boxWhereClause.isIndoor = erInnendors;
      // }
      // 
      // if (harVindu !== undefined) {
      //   boxWhereClause.hasWindow = harVindu;
      // }
      // 
      // if (harStrom !== undefined) {
      //   boxWhereClause.hasElectricity = harStrom;
      // }
      // 
      // if (harVann !== undefined) {
      //   boxWhereClause.hasWater = harVann;
      // }
      
      if (maksHestestorrelse) {
        boxWhereClause.maxHorseSize = maksHestestorrelse;
      }

      if (minPrice || maxPrice) {
        boxWhereClause.price = {};
        if (minPrice) boxWhereClause.price.gte = minPrice;
        if (maxPrice) boxWhereClause.price.lte = maxPrice;
      }

      // Hent stall-ID-er som har boxes som matcher kriteriene
      // (Get stable IDs that have boxes matching the criteria)
      const matchendeStallplasser = await prisma.boxes.findMany({
        where: boxWhereClause,
        select: {
          stableId: true
        }
      });

      const stallId_er = Array.from(new Set(matchendeStallplasser.map(stallplass => stallplass.stableId)));
      
      if (stallId_er.length === 0) {
        return []; // Ingen stables matcher stallplasskriteriene
      }
      
      whereClause.id = { in: stallId_er };
    }

    // Fasilitetfilters - kombiner stall- og stallplassfasiliteter
    // (Amenity filters - combine stable and box amenities)
    if (amenityIds && amenityIds.length > 0) {
      // Hent stall-ID-er som har fasilitetene direkte
      // (Get stable IDs that have the amenities directly)
      const stallFasiliteter = await prisma.stable_amenity_links.findMany({
        where: {
          amenityId: { in: amenityIds }
        },
        select: {
          stableId: true
        }
      });

      // Hent stall-ID-er som har boxes med fasilitetene
      // (Get stable IDs that have boxes with the amenities)
      const stallplassFasiliteter = await prisma.box_amenity_links.findMany({
        where: {
          amenityId: { in: amenityIds }
        },
        select: {
          boxId: true
        }
      });

      // Hent stall-ID-er fra boxes som har fasilitetene
      // (Get stable IDs from boxes that have the amenities)
      let stallplassStallId_er: string[] = [];
      
      if (stallplassFasiliteter.length > 0) {
        const stallplassId_er = stallplassFasiliteter.map(sf => sf.boxId);
        const boxes = await prisma.boxes.findMany({
          where: {
            id: { in: stallplassId_er }
          },
          select: {
            stableId: true
          }
        });

        stallplassStallId_er = boxes.map(stallplass => stallplass.stableId);
      }

      // Kombiner stall-ID-er fra både stall- og stallplassfasiliteter
      // (Combine stable IDs from both stable and box amenities)
      const alleStallId_er = [
        ...stallFasiliteter.map(sf => sf.stableId),
        ...stallplassStallId_er
      ];
      const unike_stallId_er = Array.from(new Set(alleStallId_er));

      if (unike_stallId_er.length === 0) {
        return []; // Ingen stables matcher fasilitetskriteriene
      }

      // Combine with existing ID filter if it exists
      if (whereClause.id && typeof whereClause.id === 'object' && 'in' in whereClause.id && whereClause.id.in) {
        const existingIds = whereClause.id.in as string[];
        const filteredIds = existingIds.filter((id: string) => unike_stallId_er.includes(id));
        if (filteredIds.length === 0) {
          return []; // No intersection between filters
        }
        whereClause.id = { in: filteredIds };
      } else {
        whereClause.id = { in: unike_stallId_er };
      }
    }

    const stables = await prisma.stables.findMany({
      where: whereClause,
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match expected type structure
    return stables.map(stable => ({
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users
    })) as unknown as StableWithAmenities[];
  } catch (error) {
    throw new Error(`Feil ved søk av stables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get featured stables
 */
export async function getFeaturedStables(): Promise<StableWithAmenities[]> {
  try {
    const stables = await prisma.stables.findMany({
      where: {
        // featured field removed from schema - showing all stables instead
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    });

    // Transform to match expected type structure
    return stables.map(stable => ({
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users
    })) as unknown as StableWithAmenities[];
  } catch (error) {
    throw new Error(`Feil ved henting av fremhevede stables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hent stables som har spesifikke fasiliteter
 * Get stables that have specific amenities
 */
export async function hentStaller_EtterFasiliteter(fasilitetId_er: string[]): Promise<StableWithAmenities[]> {
  try {
    // Hent stall-ID-er som har disse fasilitetene
    const fasilitetLenker = await prisma.stable_amenity_links.findMany({
      where: {
        amenityId: { in: fasilitetId_er }
      },
      select: {
        stableId: true
      }
    });

    if (fasilitetLenker.length === 0) {
      return [];
    }

    const stallId_er = Array.from(new Set(fasilitetLenker.map(lenke => lenke.stableId)));

    const stables = await prisma.stables.findMany({
      where: {
        id: { in: stallId_er }
      },
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match expected type structure
    return stables.map(stable => ({
      ...stable,
      amenities: stable.stable_amenity_links.map(link => ({
        amenity: link.stable_amenities
      })),
      owner: stable.users
    })) as unknown as StableWithAmenities[];
  } catch (error) {
    throw new Error(`Feil ved henting av stables med fasiliteter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Real-time subscription functions - TODO: Implement with TanStack Query
// These functions were removed during Prisma migration and will need to be re-implemented
// using TanStack Query hooks when the frontend migration is complete.

// TODO: Implement real-time stable updates using TanStack Query subscriptions
// Original function: abonnerPa_stallendringer
// Purpose: Subscribe to stable changes for real-time updates

// TODO: Implement real-time stable amenity updates using TanStack Query subscriptions  
// Original function: abonnerPa_stallfasilitetendringer
// Purpose: Subscribe to stable amenity changes

// TODO: Implement real-time advertising status updates using TanStack Query subscriptions
// Original function: abonnerPa_stallreklaemendringer  
// Purpose: Subscribe to advertising status changes for stables

// TODO: Implement real-time box statistics updates using TanStack Query subscriptions
// Original function: abonnerPa_stallplassstatistikkendringer
// Purpose: Subscribe to box changes that affect stable statistics

// TODO: Implement real-time rental statistics updates using TanStack Query subscriptions
// Original function: abonnerPa_utleiestatistikkendringer
// Purpose: Subscribe to rental status changes that affect stable availability stats

// TODO: Implement real-time specific stable updates using TanStack Query subscriptions
// Original function: abonnerPa_spesifikkStall
// Purpose: Subscribe to changes for a specific stable

// TODO: Implement real-time review updates using TanStack Query subscriptions
// Original function: abonnerPa_stallanmeldelseendringer
// Purpose: Subscribe to review changes that affect stable ratings

// TODO: Implement channel management functions using TanStack Query
// Original functions: avsluttAbonnement_stallkanal, abonnerPa_alleStallendringer, avsluttAbonnement_flereStallkanaler
// Purpose: Manage multiple real-time subscriptions

