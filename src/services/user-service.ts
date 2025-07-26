import { prisma } from './prisma';
import type { users, Prisma } from '@/generated/prisma';

// Use Prisma types as foundation
export type CreateUserData = Prisma.usersCreateInput;
export type UpdateUserData = Prisma.usersUpdateInput;

/**
 * Create a new user in the database
 */
export async function createUser(data: CreateUserData): Promise<users> {
  return await prisma.users.create({
    data
  });
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<users | null> {
  return await prisma.users.findUnique({
    where: { id }
  });
}

/**
 * Update user profile
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<users> {
  return await prisma.users.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Ensure user exists in database (create if not exists, update if exists)
 * This should be called on login to sync user with our database
 */
export async function ensureUserExists(data: CreateUserData): Promise<users> {
  return await prisma.users.upsert({
    where: { id: data.id },
    create: data,
    update: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Delete user from database
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.users.delete({
    where: { id }
  });
}