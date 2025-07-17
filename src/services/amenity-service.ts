import { prisma } from '@/lib/prisma';
import { Amenity } from '@prisma/client';

/**
 * Get all amenities (for display and filtering)
 */
export async function getAllAmenities(): Promise<Amenity[]> {
  return await prisma.amenity.findMany({
    orderBy: { name: 'asc' }
  });
}