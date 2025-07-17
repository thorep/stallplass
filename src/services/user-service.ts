import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export interface CreateUserData {
  firebaseId: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Create a new user in the database
 */
export async function createUser(data: CreateUserData): Promise<User> {
  return await prisma.user.create({
    data: {
      firebaseId: data.firebaseId,
      email: data.email,
      name: data.name,
      phone: data.phone
    }
  });
}

/**
 * Get user by Firebase ID
 */
export async function getUserByFirebaseId(firebaseId: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { firebaseId }
  });
}

/**
 * Update user profile
 */
export async function updateUser(firebaseId: string, data: UpdateUserData): Promise<User> {
  return await prisma.user.update({
    where: { firebaseId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Ensure user exists in database (create if not exists, update if exists)
 * This should be called on login to sync Firebase user with our database
 */
export async function ensureUserExists(data: CreateUserData): Promise<User> {
  return await prisma.user.upsert({
    where: { firebaseId: data.firebaseId },
    update: {
      email: data.email,
      name: data.name || undefined,
      updatedAt: new Date()
    },
    create: {
      firebaseId: data.firebaseId,
      email: data.email,
      name: data.name,
      phone: data.phone
    }
  });
}

/**
 * Delete user from database
 */
export async function deleteUser(firebaseId: string): Promise<void> {
  await prisma.user.delete({
    where: { firebaseId }
  });
}