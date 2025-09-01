import { CreateHorseData, UpdateHorseData, HorseWithOwner } from "@/types/horse";
import { prisma } from "./prisma";
import { logger } from "@/lib/logger";

/**
 * Get all horses for a user (both owned and shared)
 */
export async function getUserHorses(userId: string, includeArchived: boolean = false): Promise<HorseWithOwner[]> {
  try {
    // Get owned horses
    const ownedHorses = await prisma.horses.findMany({
      where: {
        ownerId: userId,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        },
        stable: {
          where: {
            archived: false
          },
          select: {
            id: true,
            name: true,
            address: true,
            postalCode: true,
            postalPlace: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    // Get shared horses
    const sharedHorses = await prisma.horses.findMany({
      where: {
        horseShares: {
          some: {
            sharedWithId: userId
          }
        },
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        },
        stable: {
          where: {
            archived: false
          },
          select: {
            id: true,
            name: true,
            address: true,
            postalCode: true,
            postalPlace: true,
            latitude: true,
            longitude: true
          }
        },
        horseShares: {
          where: {
            sharedWithId: userId
          },
          include: {
            sharedBy: {
              select: {
                id: true,
                nickname: true,
              }
            }
          }
        }
      }
    });

    // Combine and format the results
    const allHorses: HorseWithOwner[] = [
      // Owned horses
      ...ownedHorses.map(horse => ({
        ...horse,
        isOwner: true,
        permissions: undefined,
        sharedBy: null
      })),
      // Shared horses
      ...sharedHorses.map(horse => {
        const { horseShares, ...horseData } = horse;
        return {
          ...horseData,
          isOwner: false,
          permissions: horseShares[0]?.permissions || [],
          sharedBy: horseShares[0]?.sharedBy || null
        };
      })
    ];

    // Sort by creation date (most recent first)
    allHorses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allHorses;
  } catch (error) {
    logger.error({ error, userId, includeArchived }, 'Error fetching user horses');
    throw new Error('Failed to fetch horses');
  }
}

/**
 * Get a single horse by ID (only if user owns it or has been shared with them)
 */
export async function getHorseById(horseId: string, userId?: string): Promise<HorseWithOwner | null> {
  try {
    const horse = await prisma.horses.findUnique({
      where: { id: horseId },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        },
        stable: {
          where: {
            archived: false
          },
          select: {
            id: true,
            name: true,
            address: true,
            postalCode: true,
            postalPlace: true,
            latitude: true,
            longitude: true
          }
        },
        horseShares: {
          where: {
            sharedWithId: userId || ''
          },
          include: {
            sharedBy: {
              select: {
                id: true,
                nickname: true,
              }
            }
          }
        }
      }
    });

    if (!horse) return null;

    // Check if user can access this horse
    if (userId) {
      const isOwner = horse.ownerId === userId;
      const isShared = horse.horseShares.length > 0;
      
      if (isOwner || isShared) {
        const { horseShares, ...horseData } = horse;
        return {
          ...horseData,
          isOwner,
          permissions: isShared ? horseShares[0]?.permissions || [] : undefined,
          sharedBy: isShared ? horseShares[0]?.sharedBy || null : null
        };
      }
    }

    return null;
  } catch (error) {
    logger.error({ error, horseId, userId }, 'Error fetching horse');
    throw new Error('Failed to fetch horse');
  }
}


/**
 * Create a new horse
 */
export async function createHorse(userId: string, data: CreateHorseData): Promise<HorseWithOwner> {
  try {
    const horse = await prisma.horses.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        },
        stable: {
          where: {
            archived: false
          },
          select: {
            id: true,
            name: true,
            address: true,
            postalCode: true,
            postalPlace: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    // No default categories are created for new horses
    // Users can create their own custom categories as needed

    return horse;
  } catch (error) {
    logger.error({ error, userId, data }, 'Error creating horse');
    throw new Error('Failed to create horse');
  }
}

/**
 * Update a horse (only if user owns it or has EDIT permissions)
 */
export async function updateHorse(horseId: string, userId: string, data: UpdateHorseData): Promise<HorseWithOwner | null> {
  try {
    // First check if user has access to this horse
    const existingHorse = await prisma.horses.findUnique({
      where: { id: horseId },
      include: {
        horseShares: {
          where: {
            sharedWithId: userId
          },
          include: {
            sharedBy: {
              select: {
                id: true,
                nickname: true,
              }
            }
          }
        }
      }
    });

    if (!existingHorse) {
      return null;
    }

    const isOwner = existingHorse.ownerId === userId;
    const isShared = existingHorse.horseShares.length > 0;
    const hasEditPermission = isShared && existingHorse.horseShares[0]?.permissions.includes('EDIT');

    // Only allow updates if user is owner or has EDIT permission
    if (!isOwner && !hasEditPermission) {
      return null;
    }

    const horse = await prisma.horses.update({
      where: { id: horseId },
      data: {
        ...data,
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        },
        stable: {
          where: {
            archived: false
          },
          select: {
            id: true,
            name: true,
            address: true,
            postalCode: true,
            postalPlace: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    return {
      ...horse,
      isOwner,
      permissions: isShared ? existingHorse.horseShares[0]?.permissions || [] : undefined,
      sharedBy: isShared ? existingHorse.horseShares[0]?.sharedBy || null : null
    };
  } catch (error) {
    logger.error({ error, horseId, userId, data }, 'Error updating horse');
    throw new Error('Failed to update horse');
  }
}

/**
 * Delete/Archive a horse (only if user owns it)
 */
export async function deleteHorse(horseId: string, userId: string): Promise<boolean> {
  try {
    // First verify ownership
    const existingHorse = await prisma.horses.findUnique({
      where: { id: horseId }
    });

    if (!existingHorse || existingHorse.ownerId !== userId) {
      return false;
    }

    await prisma.horses.update({
      where: { id: horseId },
      data: {
        archived: true,
        deletedAt: new Date(),
      }
    });

    return true;
  } catch (error) {
    logger.error({ error, horseId, userId }, 'Error deleting horse');
    throw new Error('Failed to delete horse');
  }
}

/**
 * Share a horse with another user (only owner can share)
 */
export async function shareHorse(
  horseId: string, 
  ownerId: string, 
  sharedWithId: string, 
  permissions: string[] = ["VIEW", "EDIT", "ADD_LOGS"]
): Promise<{ id: string; horseId: string; sharedWithId: string; sharedById: string; permissions: string[]; createdAt: Date; updatedAt: Date; } | null> {
  try {
    // First verify horse ownership
    const horse = await prisma.horses.findUnique({
      where: { id: horseId }
    });

    if (!horse || horse.ownerId !== ownerId) {
      return null;
    }

    // Check if user exists
    const userExists = await prisma.profiles.findUnique({
      where: { id: sharedWithId }
    });

    if (!userExists) {
      throw new Error('User not found');
    }

    // Create the horse share record
    const horseShare = await prisma.horse_shares.create({
      data: {
        horseId,
        sharedWithId,
        sharedById: ownerId,
        permissions,
      }
    });

    return horseShare;
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      throw error;
    }
    logger.error({ error, horseId, ownerId, sharedWithId, permissions }, 'Error sharing horse');
    throw new Error('Failed to share horse');
  }
}

/**
 * Unshare a horse from a user (only owner can unshare)
 */
export async function unshareHorse(horseId: string, ownerId: string, sharedWithId: string): Promise<boolean> {
  try {
    // First verify horse ownership
    const horse = await prisma.horses.findUnique({
      where: { id: horseId }
    });

    if (!horse || horse.ownerId !== ownerId) {
      return false;
    }

    // Delete the horse share record
    const deleted = await prisma.horse_shares.deleteMany({
      where: {
        horseId,
        sharedWithId,
      }
    });

    return deleted.count > 0;
  } catch (error) {
    logger.error({ error, horseId, ownerId, sharedWithId }, 'Error unsharing horse');
    throw new Error('Failed to unshare horse');
  }
}

/**
 * Get all users who have access to a horse (only owner can view)
 */
export async function getHorseShares(horseId: string, ownerId: string) {
  try {
    // First verify horse ownership
    const horse = await prisma.horses.findUnique({
      where: { id: horseId }
    });

    if (!horse || horse.ownerId !== ownerId) {
      return null;
    }

    // Get all shares for this horse
    const shares = await prisma.horse_shares.findMany({
      where: { horseId },
      include: {
        sharedWith: {
          select: {
            id: true,
            nickname: true,
            firstname: true,
            lastname: true,
          }
        },
        sharedBy: {
          select: {
            id: true,
            nickname: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return shares;
  } catch (error) {
    logger.error({ error, horseId, ownerId }, 'Error fetching horse shares');
    throw new Error('Failed to fetch horse shares');
  }
}

