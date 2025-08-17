import { prisma } from './prisma';
import type { horse_disciplines } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Get all horse disciplines
 */
export async function getAllHorseDisciplines(): Promise<horse_disciplines[]> {
  try {
    const disciplines = await prisma.horse_disciplines.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return disciplines;
  } catch {
    throw new Error('Failed to fetch horse disciplines');
  }
}

/**
 * Get active horse disciplines only
 */
export async function getActiveHorseDisciplines(): Promise<horse_disciplines[]> {
  try {
    const disciplines = await prisma.horse_disciplines.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return disciplines;
  } catch {
    throw new Error('Failed to fetch active horse disciplines');
  }
}

// ============ ADMIN CRUD OPERATIONS ============

/**
 * Create a new horse discipline
 */
export async function createHorseDiscipline(data: {
  name: string;
  isActive?: boolean;
}): Promise<horse_disciplines> {
  try {
    const discipline = await prisma.horse_disciplines.create({
      data: {
        name: data.name.trim(),
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      }
    });
    return discipline;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A horse discipline with this name already exists');
    }
    throw new Error('Failed to create horse discipline');
  }
}

/**
 * Update a horse discipline
 */
export async function updateHorseDiscipline(
  id: string, 
  data: {
    name?: string;
    isActive?: boolean;
  }
): Promise<horse_disciplines> {
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

    const discipline = await prisma.horse_disciplines.update({
      where: { id },
      data: updateData
    });
    return discipline;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A horse discipline with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Horse discipline not found');
      }
    }
    throw new Error('Failed to update horse discipline');
  }
}

/**
 * Delete a horse discipline (with protection if in use)
 */
export async function deleteHorseDiscipline(id: string): Promise<void> {
  try {
    // First check if any horse sales are using this discipline
    const horseSalesUsingDiscipline = await prisma.horse_sales.count({
      where: { disciplineId: id }
    });

    if (horseSalesUsingDiscipline > 0) {
      throw new Error(`Cannot delete horse discipline: ${horseSalesUsingDiscipline} horse sale(s) are currently using this discipline`);
    }

    await prisma.horse_disciplines.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('Horse discipline not found');
    }
    // Re-throw known business logic errors
    if (error instanceof Error && error.message.includes('Cannot delete horse discipline')) {
      throw error;
    }
    throw new Error('Failed to delete horse discipline');
  }
}

/**
 * Get horse discipline by ID
 */
export async function getHorseDisciplineById(id: string): Promise<horse_disciplines | null> {
  try {
    const discipline = await prisma.horse_disciplines.findUnique({
      where: { id }
    });
    return discipline;
  } catch {
    throw new Error('Failed to fetch horse discipline');
  }
}