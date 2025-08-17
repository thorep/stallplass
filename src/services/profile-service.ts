import { prisma } from './prisma';
import type { profiles, Prisma } from '@/generated/prisma';

// Use Prisma types as foundation
export type CreateProfileData = Prisma.profilesCreateInput;
export type UpdateProfileData = Prisma.profilesUpdateInput;

/**
 * Create a new profile in the database
 */
export async function createProfile(data: CreateProfileData): Promise<profiles> {
  return await prisma.profiles.create({
    data
  });
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: string): Promise<profiles | null> {
  return await prisma.profiles.findUnique({
    where: { id }
  });
}

/**
 * Update profile
 */
export async function updateProfile(id: string, data: UpdateProfileData): Promise<profiles> {
  return await prisma.profiles.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Ensure profile exists in database (create if not exists, update if exists)
 * This should be called on login to sync profile with our database
 */
export async function ensureProfileExists(data: CreateProfileData): Promise<profiles> {
  return await prisma.profiles.upsert({
    where: { id: data.id },
    create: data,
    update: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Delete profile from database
 * This will set conversations.userId to null for all conversations the user was part of,
 * preserving messages for other participants while allowing clean profile deletion.
 */
export async function deleteProfile(id: string): Promise<void> {
  // Use a transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // First, update conversations to set userId to null
    // This is handled automatically by the onDelete: SetNull constraint,
    // but we're being explicit here for clarity
    await tx.conversations.updateMany({
      where: { userId: id },
      data: { userId: null }
    });
    
    // Then delete the profile
    // All other relations with onDelete: Cascade will be handled automatically
    await tx.profiles.delete({
      where: { id }
    });
  });
}

/**
 * Search users by nickname (partial matching)
 * Excludes the current user from results
 */
export async function searchUsersByNickname(
  query: string, 
  excludeUserId: string, 
  limit: number = 15
): Promise<Array<{ id: string; nickname: string; firstname: string | null; lastname: string | null }>> {
  return await prisma.profiles.findMany({
    where: {
      AND: [
        { nickname: { contains: query, mode: 'insensitive' } },
        { id: { not: excludeUserId } }
      ]
    },
    select: {
      id: true,
      nickname: true,
      firstname: true,
      lastname: true
    },
    take: limit,
    orderBy: [
      { nickname: 'asc' }
    ]
  });
}

/**
 * Get user's favorite stables
 */
export async function getUserFavoriteStables(userId: string): Promise<string[]> {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId }
  }) as { favoriteStables?: string[] } | null;
  
  return profile?.favoriteStables || [];
}

/**
 * Add stable to user's favorites
 */
export async function addFavoriteStable(userId: string, stableId: string): Promise<string[]> {
  // First check if stable exists
  const stable = await prisma.stables.findUnique({
    where: { id: stableId },
    select: { id: true }
  });

  if (!stable) {
    throw new Error('Stable not found');
  }

  // Get current favorites
  const currentFavorites = await getUserFavoriteStables(userId);
  
  // Check if already in favorites
  if (currentFavorites.includes(stableId)) {
    throw new Error('Stable already in favorites');
  }

  // Add to favorites
  const updatedFavorites = [...currentFavorites, stableId];
  
  await prisma.profiles.update({
    where: { id: userId },
    data: { 
      favoriteStables: updatedFavorites,
      updatedAt: new Date()
    }
  });

  return updatedFavorites;
}

/**
 * Remove stable from user's favorites
 */
export async function removeFavoriteStable(userId: string, stableId: string): Promise<string[]> {
  // Get current favorites
  const currentFavorites = await getUserFavoriteStables(userId);
  
  // Check if in favorites
  if (!currentFavorites.includes(stableId)) {
    throw new Error('Stable not in favorites');
  }

  // Remove from favorites
  const updatedFavorites = currentFavorites.filter(id => id !== stableId);
  
  await prisma.profiles.update({
    where: { id: userId },
    data: { 
      favoriteStables: updatedFavorites,
      updatedAt: new Date()
    }
  });

  return updatedFavorites;
}
