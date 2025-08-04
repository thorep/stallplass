import { CreateHorseData, UpdateHorseData, HorseWithOwner } from "@/types/horse";
import { prisma } from "./prisma";
import { generateSlug } from "@/lib/utils";

/**
 * Get all horses for a user
 */
export async function getUserHorses(userId: string, includeArchived: boolean = false): Promise<HorseWithOwner[]> {
  try {
    const horses = await prisma.horses.findMany({
      where: {
        ownerId: userId,
        ...(includeArchived ? {} : { archived: false })
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return horses;
  } catch (error) {
    console.error('Error fetching user horses:', error);
    throw new Error('Failed to fetch horses');
  }
}

/**
 * Get a single horse by ID (only if user owns it or it's public)
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
        }
      }
    });

    if (!horse) return null;

    // Check if user can access this horse
    if (horse.isPublic || (userId && horse.ownerId === userId)) {
      return horse;
    }

    return null;
  } catch (error) {
    console.error('Error fetching horse:', error);
    throw new Error('Failed to fetch horse');
  }
}

/**
 * Get a horse by public slug
 */
export async function getHorseBySlug(slug: string): Promise<HorseWithOwner | null> {
  try {
    const horse = await prisma.horses.findUnique({
      where: { 
        publicSlug: slug,
        isPublic: true,
        archived: false
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        }
      }
    });

    return horse;
  } catch (error) {
    console.error('Error fetching horse by slug:', error);
    throw new Error('Failed to fetch horse');
  }
}

/**
 * Create a new horse
 */
export async function createHorse(userId: string, data: CreateHorseData): Promise<HorseWithOwner> {
  try {
    // Generate slug if making public
    let publicSlug = null;
    if (data.isPublic) {
      publicSlug = await generateUniqueSlug(data.name);
    }

    const horse = await prisma.horses.create({
      data: {
        ...data,
        ownerId: userId,
        publicSlug,
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        }
      }
    });

    return horse;
  } catch (error) {
    console.error('Error creating horse:', error);
    throw new Error('Failed to create horse');
  }
}

/**
 * Update a horse (only if user owns it)
 */
export async function updateHorse(horseId: string, userId: string, data: UpdateHorseData): Promise<HorseWithOwner | null> {
  try {
    // First verify ownership
    const existingHorse = await prisma.horses.findUnique({
      where: { id: horseId }
    });

    if (!existingHorse || existingHorse.ownerId !== userId) {
      return null;
    }

    // Handle slug generation if making public
    let publicSlug = existingHorse.publicSlug;
    if (data.isPublic && !publicSlug) {
      publicSlug = await generateUniqueSlug(data.name || existingHorse.name);
    } else if (!data.isPublic) {
      publicSlug = null;
    }

    const horse = await prisma.horses.update({
      where: { id: horseId },
      data: {
        ...data,
        publicSlug,
      },
      include: {
        profiles: {
          select: {
            nickname: true,
          }
        }
      }
    });

    return horse;
  } catch (error) {
    console.error('Error updating horse:', error);
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
        isPublic: false, // Make private when archived
        publicSlug: null,
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting horse:', error);
    throw new Error('Failed to delete horse');
  }
}

/**
 * Generate a unique slug for public horses
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.horses.findUnique({
      where: { publicSlug: slug }
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}