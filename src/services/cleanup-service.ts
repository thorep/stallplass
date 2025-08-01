/**
 * Cleanup service for handling expired advertising and sponsored placements
 * Can be called manually or via cron jobs
 */

import { prisma } from '@/services/prisma';

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
  const now = new Date().toISOString();
  
  try {
    // 1. Deactivate expired stable advertising
    const expiredStablesResult = await prisma.stables.updateMany({
      where: {
        advertisingActive: true,
        advertisingEndDate: {
          lt: new Date(now)
        }
      },
      data: {
        advertisingActive: false
      }
    });

    const expiredStablesCount = expiredStablesResult.count;

    // 2. Deactivate boxes for stables with expired advertising
    // Get stables with inactive advertising
    const inactiveStables = await prisma.stables.findMany({
      where: { advertisingActive: false },
      select: { id: true }
    });

    const inactiveStableIds = inactiveStables.map(s => s.id);
    
    // Only try to deactivate boxes if there are inactive stables
    let deactivatedBoxesCount = 0;
    if (inactiveStableIds.length > 0) {
      const deactivatedBoxesResult = await prisma.boxes.updateMany({
        where: {
          isActive: true,
          stableId: {
            in: inactiveStableIds
          }
        },
        data: {
          isActive: false
        }
      });
      
      deactivatedBoxesCount = deactivatedBoxesResult.count;
    }

    // 3. Remove expired sponsored placements
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
      expiredStables: expiredStablesCount,
      deactivatedBoxes: deactivatedBoxesCount,
      expiredSponsoredBoxes: expiredSponsoredCount,
      timestamp: new Date()
    };

  } catch {
    throw new Error('Failed to cleanup expired content');
  }
}

/**
 * Get stables that will expire soon (for notifications)
 */
export async function getExpiringStables(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000));

  const stables = await prisma.stables.findMany({
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
          name: true
        }
      }
    },
    orderBy: {
      advertisingEndDate: 'asc'
    }
  });

  return stables;
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
      stable: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true
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