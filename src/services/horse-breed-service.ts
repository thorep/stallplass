import { prisma } from './prisma';
import type { horse_breeds } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Get all horse breeds
 */
export async function getAllHorseBreeds(): Promise<horse_breeds[]> {
  try {
    const breeds = await prisma.horse_breeds.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return breeds;
  } catch {
    throw new Error('Failed to fetch horse breeds');
  }
}

/**
 * Get active horse breeds only
 */
export async function getActiveHorseBreeds(): Promise<horse_breeds[]> {
  try {
    const breeds = await prisma.horse_breeds.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return breeds;
  } catch {
    throw new Error('Failed to fetch active horse breeds');
  }
}

// ============ ADMIN CRUD OPERATIONS ============

/**
 * Create a new horse breed
 */
export async function createHorseBreed(data: {
  name: string;
  isActive?: boolean;
}): Promise<horse_breeds> {
  try {
    const breed = await prisma.horse_breeds.create({
      data: {
        name: data.name.trim(),
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      }
    });
    return breed;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A horse breed with this name already exists');
    }
    throw new Error('Failed to create horse breed');
  }
}

/**
 * Update a horse breed
 */
export async function updateHorseBreed(
  id: string, 
  data: {
    name?: string;
    isActive?: boolean;
  }
): Promise<horse_breeds> {
  try {
    const updateData: Partial<{
      name: string;
      isActive: boolean;
      updatedAt: Date;
    }> = {
      updatedAt: new Date()
    };

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const breed = await prisma.horse_breeds.update({
      where: { id },
      data: updateData
    });
    return breed;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A horse breed with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Horse breed not found');
      }
    }
    throw new Error('Failed to update horse breed');
  }
}

/**
 * Delete a horse breed (with protection if in use)
 */
export async function deleteHorseBreed(id: string): Promise<void> {
  try {
    // First check if any horse sales are using this breed
    const horseSalesUsingBreed = await prisma.horse_sales.count({
      where: { breedId: id }
    });

    if (horseSalesUsingBreed > 0) {
      throw new Error(`Cannot delete horse breed: ${horseSalesUsingBreed} horse sale(s) are currently using this breed`);
    }

    await prisma.horse_breeds.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('Horse breed not found');
    }
    // Re-throw known business logic errors
    if (error instanceof Error && error.message.includes('Cannot delete horse breed')) {
      throw error;
    }
    throw new Error('Failed to delete horse breed');
  }
}

/**
 * Get horse breed by ID
 */
export async function getHorseBreedById(id: string): Promise<horse_breeds | null> {
  try {
    const breed = await prisma.horse_breeds.findUnique({
      where: { id }
    });
    return breed;
  } catch {
    throw new Error('Failed to fetch horse breed');
  }
}