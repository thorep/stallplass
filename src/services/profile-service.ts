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
 */
export async function deleteProfile(id: string): Promise<void> {
  await prisma.profiles.delete({
    where: { id }
  });
}
