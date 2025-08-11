import { prisma } from '@/services/prisma';

export interface PublicStats {
  activeStables: number;
  registeredUsers: number;
  activeBoxes: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  try {
    // Get count of active stables (stables that are not deleted)
    const activeStables = await prisma.stables.count({
      where: {
        deletedAt: null
      }
    });

    // Get count of registered users (profiles)
    const registeredUsers = await prisma.profiles.count();

    // Get count of active boxes (boxes that are not deleted)
    const activeBoxes = await prisma.boxes.count({
      where: {
        deletedAt: null
      }
    });

    return {
      activeStables,
      registeredUsers,
      activeBoxes
    };
  } catch (error) {
    console.error('Error fetching public stats:', error);
    // Return fallback values if there's an error
    return {
      activeStables: 0,
      registeredUsers: 0,
      activeBoxes: 0
    };
  }
}