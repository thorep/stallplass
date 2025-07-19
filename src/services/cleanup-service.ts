/**
 * Cleanup service for handling expired advertising and sponsored placements
 * Can be called manually or via cron jobs
 */

import { prisma } from '@/lib/prisma';

export interface CleanupResults {
  expiredStables: number;
  deactivatedBoxes: number;
  expiredSponsoredBoxes: number;
  timestamp: Date;
}

/**
 * Clean up all expired advertising and sponsored placements
 */
export async function cleanupExpiredContent(): Promise<CleanupResults> {
  const now = new Date();
  
  try {
    // 1. Deactivate expired stable advertising
    const expiredStables = await prisma.stable.updateMany({
      where: {
        advertisingActive: true,
        advertisingEndDate: {
          lt: now
        }
      },
      data: {
        advertisingActive: false
      }
    });

    // 2. Deactivate boxes for stables with expired advertising
    const deactivatedBoxes = await prisma.box.updateMany({
      where: {
        isActive: true,
        stable: {
          advertisingActive: false
        }
      },
      data: {
        isActive: false
      }
    });

    // 3. Remove expired sponsored placements
    const expiredSponsoredBoxes = await prisma.box.updateMany({
      where: {
        isSponsored: true,
        sponsoredUntil: {
          lt: now
        }
      },
      data: {
        isSponsored: false,
        sponsoredUntil: null,
        sponsoredStartDate: null
      }
    });

    return {
      expiredStables: expiredStables.count,
      deactivatedBoxes: deactivatedBoxes.count,
      expiredSponsoredBoxes: expiredSponsoredBoxes.count,
      timestamp: now
    };

  } catch (error) {
    console.error('Cleanup operation failed:', error);
    throw new Error('Failed to cleanup expired content');
  }
}

/**
 * Get stables that will expire soon (for notifications)
 */
export async function getExpiringStables(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

  return await prisma.stable.findMany({
    where: {
      advertisingActive: true,
      advertisingEndDate: {
        gte: now,
        lte: futureDate
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          firebaseId: true
        }
      }
    },
    orderBy: {
      advertisingEndDate: 'asc'
    }
  });
}

/**
 * Get sponsored placements that will expire soon
 */
export async function getExpiringSponsoredPlacements(daysAhead: number = 3) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

  return await prisma.box.findMany({
    where: {
      isSponsored: true,
      sponsoredUntil: {
        gte: now,
        lte: futureDate
      }
    },
    include: {
      stable: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              firebaseId: true
            }
          }
        }
      }
    },
    orderBy: {
      sponsoredUntil: 'asc'
    }
  });
}

/**
 * Manual cleanup function that can be called from admin panel
 */
export async function forceCleanup(): Promise<CleanupResults> {
  return await cleanupExpiredContent();
}