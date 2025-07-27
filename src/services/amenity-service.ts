import { prisma } from './prisma';
import type { stable_amenities, box_amenities } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Get all stable amenities
 */
export async function getAllStableAmenities(): Promise<stable_amenities[]> {
  try {
    const amenities = await prisma.stable_amenities.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return amenities;
  } catch (error) {
    console.error('Error fetching stable amenities:', error);
    throw new Error('Failed to fetch stable amenities');
  }
}

/**
 * Get all box amenities
 */
export async function getAllBoxAmenities(): Promise<box_amenities[]> {
  try {
    const amenities = await prisma.box_amenities.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return amenities;
  } catch (error) {
    console.error('Error fetching box amenities:', error);
    throw new Error('Failed to fetch box amenities');
  }
}

// ============ ADMIN CRUD OPERATIONS ============

/**
 * Create a new stable amenity
 */
export async function createStableAmenity(name: string): Promise<stable_amenities> {
  try {
    const amenity = await prisma.stable_amenities.create({
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    });
    return amenity;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A stable amenity with this name already exists');
    }
    console.error('Error creating stable amenity:', error);
    throw new Error('Failed to create stable amenity');
  }
}

/**
 * Update a stable amenity
 */
export async function updateStableAmenity(id: string, name: string): Promise<stable_amenities> {
  try {
    const amenity = await prisma.stable_amenities.update({
      where: { id },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    });
    return amenity;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A stable amenity with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Stable amenity not found');
      }
    }
    console.error('Error updating stable amenity:', error);
    throw new Error('Failed to update stable amenity');
  }
}

/**
 * Delete a stable amenity
 */
export async function deleteStableAmenity(id: string): Promise<void> {
  try {
    await prisma.stable_amenities.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('Stable amenity not found');
    }
    console.error('Error deleting stable amenity:', error);
    throw new Error('Failed to delete stable amenity');
  }
}

/**
 * Create a new box amenity
 */
export async function createBoxAmenity(name: string): Promise<box_amenities> {
  try {
    const amenity = await prisma.box_amenities.create({
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    });
    return amenity;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A box amenity with this name already exists');
    }
    console.error('Error creating box amenity:', error);
    throw new Error('Failed to create box amenity');
  }
}

/**
 * Update a box amenity
 */
export async function updateBoxAmenity(id: string, name: string): Promise<box_amenities> {
  try {
    const amenity = await prisma.box_amenities.update({
      where: { id },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    });
    return amenity;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A box amenity with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Box amenity not found');
      }
    }
    console.error('Error updating box amenity:', error);
    throw new Error('Failed to update box amenity');
  }
}

/**
 * Delete a box amenity
 */
export async function deleteBoxAmenity(id: string): Promise<void> {
  try {
    await prisma.box_amenities.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('Box amenity not found');
    }
    console.error('Error deleting box amenity:', error);
    throw new Error('Failed to delete box amenity');
  }
}