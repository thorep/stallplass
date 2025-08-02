/**
 * Cleanup service for handling expired advertising and sponsored placements
 * Can be called manually or via cron jobs
 */

import { prisma } from '@/services/prisma';

export interface CleanupResults {
  expiredBoxes: number;
  expiredServices: number;
  expiredSponsoredBoxes: number;
  timestamp: Date;
}

/**
 * Clean up all expired advertising and sponsored placements
 */
export async function cleanupExpiredContent(): Promise<CleanupResults> {
  const now = new Date().toISOString();
  
  try {
    // 1. Deactivate expired box advertising
    const expiredBoxesResult = await prisma.boxes.updateMany({
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

    const expiredBoxesCount = expiredBoxesResult.count;

    // 2. Deactivate expired service advertising
    const expiredServicesResult = await prisma.services.updateMany({
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

    const expiredServicesCount = expiredServicesResult.count;

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
      expiredBoxes: expiredBoxesCount,
      expiredServices: expiredServicesCount,
      expiredSponsoredBoxes: expiredSponsoredCount,
      timestamp: new Date()
    };

  } catch {
    throw new Error('Failed to cleanup expired content');
  }
}

/**
 * Get boxes with advertising that will expire soon (for notifications)
 */
export async function getExpiringBoxes(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000));

  const boxes = await prisma.boxes.findMany({
    where: {
      advertisingActive: true,
      advertisingEndDate: {
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
      advertisingEndDate: 'asc'
    }
  });

  return boxes;
}

/**
 * Get services with advertising that will expire soon (for notifications)
 */
export async function getExpiringServices(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000));

  const services = await prisma.services.findMany({
    where: {
      advertisingActive: true,
      advertisingEndDate: {
        gte: now,
        lte: futureDate
      }
    },
    include: {
      profiles: {
        select: {
          id: true,
          nickname: true
        }
      }
    },
    orderBy: {
      advertisingEndDate: 'asc'
    }
  });

  return services;
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