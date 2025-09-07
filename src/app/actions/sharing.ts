"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/services/prisma";
import { revalidatePath } from "next/cache";

export interface SearchUser {
  id: string;
  nickname: string;
  firstname: string | null;
  lastname: string | null;
}

export interface HorseShare {
  id: string;
  sharedById: string;
  sharedWithId: string;
  permissions: string[];
  createdAt: Date;
  sharedWith: {
    id: string;
    nickname: string;
    firstname: string | null;
    lastname: string | null;
  };
}

/**
 * Search users by nickname
 */
export async function searchUsersAction(query: string): Promise<SearchUser[]> {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }

  if (!query || query.trim().length < 1) {
    return [];
  }

  const users = await prisma.profiles.findMany({
    where: {
      nickname: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      nickname: true,
      firstname: true,
      lastname: true,
    },
    take: 10,
  });

  return users;
}

/**
 * Get shares for a horse
 */
export async function getHorseSharesAction(horseId: string): Promise<HorseShare[]> {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Check if user owns the horse
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { ownerId: true },
  });

  if (!horse || horse.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  const shares = await prisma.horse_shares.findMany({
    where: { horseId },
    include: {
      sharedWith: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return shares;
}

/**
 * Share horse with user
 */
export async function shareHorseAction(horseId: string, sharedWithId: string, permissions: string[] = ['VIEW', 'ADD_LOGS']) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Check if user owns the horse
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { ownerId: true },
  });

  if (!horse || horse.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Check if already shared
  const existingShare = await prisma.horse_shares.findFirst({
    where: {
      horseId,
      sharedWithId,
    },
  });

  if (existingShare) {
    throw new Error("Horse is already shared with this user");
  }

  // Check if user exists
  const targetUser = await prisma.profiles.findUnique({
    where: { id: sharedWithId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  await prisma.horse_shares.create({
    data: {
      horseId,
      sharedById: user.id,
      sharedWithId,
      permissions,
    },
  });

  revalidatePath(`/mine-hester/${horseId}/del`);
}

/**
 * Unshare horse from user
 */
export async function unshareHorseAction(horseId: string, sharedWithId: string) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Check if user owns the horse
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { ownerId: true },
  });

  if (!horse || horse.ownerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.horse_shares.deleteMany({
    where: {
      horseId,
      sharedWithId,
    },
  });

  revalidatePath(`/mine-hester/${horseId}/del`);
}