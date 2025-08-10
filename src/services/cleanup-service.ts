/**
 * Cleanup service for handling expired sponsored placements
 * Can be called manually or via cron jobs
 */

import { prisma } from '@/services/prisma';

export interface CleanupResults {
  expiredSponsoredBoxes: number;
  timestamp: Date;
}

export interface ImageCleanupResults {
  unusedImages: string[];
  archivedStableImages: number;
  archivedBoxImages: number;
  timestamp: Date;
}

/**
 * Clean up expired sponsored placements
 */
export async function cleanupExpiredContent(): Promise<CleanupResults> {
  const now = new Date().toISOString();
  
  try {
    // Remove expired sponsored placements
    const expiredSponsoredResult = await prisma.boxes.updateMany({
      where: {
        isSponsored: true,
        sponsoredUntil: {
          lt: new Date(now)
        }
      },
      data: {
        isSponsored: false,
        sponsoredUntil: null,
        sponsoredStartDate: null
      }
    });

    const expiredSponsoredCount = expiredSponsoredResult.count;

    return {
      expiredSponsoredBoxes: expiredSponsoredCount,
      timestamp: new Date()
    };

  } catch {
    throw new Error('Failed to cleanup expired sponsored content');
  }
}


/**
 * Get sponsored placements that will expire soon
 */
export async function getExpiringSponsoredPlacements(daysAhead: number = 3) {
  const now = new Date();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000));

  const boxes = await prisma.boxes.findMany({
    where: {
      isSponsored: true,
      sponsoredUntil: {
        gte: now,
        lte: futureDate
      }
    },
    include: {
      stables: {
        include: {
          profiles: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }
    },
    orderBy: {
      sponsoredUntil: 'asc'
    }
  });

  return boxes;
}

/**
 * Manual cleanup function that can be called from admin panel
 */
export async function forceCleanup(): Promise<CleanupResults> {
  return await cleanupExpiredContent();
}

/**
 * Get list of unused images from archived stables and their boxes
 * This function only returns the list without deleting anything
 */
export async function getUnusedArchivedImages(): Promise<ImageCleanupResults> {
  try {
    // Find all archived stables with their images
    const archivedStables = await prisma.stables.findMany({
      where: {
        archived: true
      },
      select: {
        id: true,
        name: true,
        images: true,
        boxes: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    // Collect all unused images
    const unusedImages: string[] = [];
    let stableImageCount = 0;
    let boxImageCount = 0;

    // Process stable images
    for (const stable of archivedStables) {
      if (stable.images && stable.images.length > 0) {
        unusedImages.push(...stable.images);
        stableImageCount += stable.images.length;
      }

      // Process box images for this stable
      for (const box of stable.boxes) {
        if (box.images && box.images.length > 0) {
          unusedImages.push(...box.images);
          boxImageCount += box.images.length;
        }
      }
    }

    // Remove duplicate images
    const uniqueUnusedImages = [...new Set(unusedImages)];

    return {
      unusedImages: uniqueUnusedImages,
      archivedStableImages: stableImageCount,
      archivedBoxImages: boxImageCount,
      timestamp: new Date()
    };

  } catch (error) {
    throw new Error(`Failed to get unused archived images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}