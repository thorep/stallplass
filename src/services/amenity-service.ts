import { prisma } from '@/lib/prisma';
import { StableAmenity, BoxAmenity } from '@prisma/client';

/**
 * Get all stable amenities
 */
export async function getAllStableAmenities(): Promise<StableAmenity[]> {
  return await prisma.stableAmenity.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Get all box amenities
 */
export async function getAllBoxAmenities(): Promise<BoxAmenity[]> {
  return await prisma.boxAmenity.findMany({
    orderBy: { name: 'asc' }
  });
}