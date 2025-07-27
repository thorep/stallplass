import { prisma } from './prisma';
import type { stable_amenities, box_amenities } from '@/generated/prisma';

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