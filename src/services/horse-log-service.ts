import { prisma } from "./prisma";

export interface CreateLogData {
  description: string;
  images?: string[];
  imageDescriptions?: string[];
}

export interface CreateCustomCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Verify that the user owns the horse
 */
async function verifyHorseOwnership(horseId: string, userId: string): Promise<boolean> {
  const horse = await prisma.horses.findFirst({
    where: {
      id: horseId,
      ownerId: userId,
      archived: false,
      deletedAt: null,
    },
  });
  
  return !!horse;
}

// Care Log functions
export async function getCareLogsByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const logs = await prisma.care_logs.findMany({
    where: {
      horseId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createCareLog(horseId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const log = await prisma.care_logs.create({
    data: {
      horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateCareLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.care_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.care_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteCareLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.care_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.care_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}

// Exercise Log functions
export async function getExerciseLogsByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const logs = await prisma.exercise_logs.findMany({
    where: {
      horseId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createExerciseLog(horseId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const log = await prisma.exercise_logs.create({
    data: {
      horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateExerciseLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.exercise_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.exercise_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteExerciseLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.exercise_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.exercise_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}

// Feeding Log functions
export async function getFeedingLogsByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const logs = await prisma.feeding_logs.findMany({
    where: {
      horseId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createFeedingLog(horseId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const log = await prisma.feeding_logs.create({
    data: {
      horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateFeedingLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.feeding_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.feeding_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteFeedingLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.feeding_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.feeding_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}

// Medical Log functions
export async function getMedicalLogsByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const logs = await prisma.medical_logs.findMany({
    where: {
      horseId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createMedicalLog(horseId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const log = await prisma.medical_logs.create({
    data: {
      horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateMedicalLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.medical_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.medical_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteMedicalLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.medical_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.medical_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}

// Other Log functions
export async function getOtherLogsByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const logs = await prisma.other_logs.findMany({
    where: {
      horseId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createOtherLog(horseId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const log = await prisma.other_logs.create({
    data: {
      horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateOtherLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.other_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.other_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteOtherLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.other_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.other_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}

// Custom Log Categories functions
export async function getCustomCategoriesByHorseId(horseId: string, userId: string) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  const categories = await prisma.custom_log_categories.findMany({
    where: {
      horseId,
      isActive: true,
    },
    include: {
      owner: {
        select: {
          id: true,
          nickname: true,
        },
      },
      _count: {
        select: {
          logs: true,
        },
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return categories;
}

export async function createCustomCategory(horseId: string, userId: string, data: CreateCustomCategoryData) {
  // First verify the user owns the horse
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) {
    return null;
  }

  // Check if category name already exists for this horse
  const existingCategory = await prisma.custom_log_categories.findFirst({
    where: {
      horseId,
      name: data.name,
    },
  });

  if (existingCategory) {
    throw new Error('Category name already exists for this horse');
  }

  const category = await prisma.custom_log_categories.create({
    data: {
      horseId,
      ownerId: userId,
      name: data.name,
      description: data.description,
      icon: data.icon || 'ClipboardList',
      color: data.color || 'text-indigo-600',
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder || 0,
    },
    include: {
      owner: {
        select: {
          id: true,
          nickname: true,
        },
      },
      _count: {
        select: {
          logs: true,
        },
      },
    },
  });

  return category;
}

export async function updateCustomCategory(categoryId: string, userId: string, data: Partial<CreateCustomCategoryData>) {
  // First verify the user owns the horse that this category belongs to
  const category = await prisma.custom_log_categories.findFirst({
    where: {
      id: categoryId,
    },
    include: {
      horse: true,
    },
  });

  if (!category || category.horse.ownerId !== userId || category.horse.archived || category.horse.deletedAt) {
    return null;
  }

  // If updating name, check if it already exists
  if (data.name && data.name !== category.name) {
    const existingCategory = await prisma.custom_log_categories.findFirst({
      where: {
        horseId: category.horseId,
        name: data.name,
        id: { not: categoryId },
      },
    });

    if (existingCategory) {
      throw new Error('Category name already exists for this horse');
    }
  }

  const updatedCategory = await prisma.custom_log_categories.update({
    where: {
      id: categoryId,
    },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon && { icon: data.icon }),
      ...(data.color && { color: data.color }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: {
      owner: {
        select: {
          id: true,
          nickname: true,
        },
      },
      _count: {
        select: {
          logs: true,
        },
      },
    },
  });

  return updatedCategory;
}

export async function deleteCustomCategory(categoryId: string, userId: string) {
  // First verify the user owns the horse that this category belongs to
  const category = await prisma.custom_log_categories.findFirst({
    where: {
      id: categoryId,
    },
    include: {
      horse: true,
    },
  });

  if (!category || category.horse.ownerId !== userId || category.horse.archived || category.horse.deletedAt) {
    return false;
  }

  await prisma.custom_log_categories.delete({
    where: {
      id: categoryId,
    },
  });

  return true;
}

// Custom Logs functions
export async function getCustomLogsByCategoryId(categoryId: string, userId: string) {
  // First verify the user owns the horse
  const category = await prisma.custom_log_categories.findFirst({
    where: {
      id: categoryId,
    },
    include: {
      horse: true,
    },
  });

  if (!category || category.horse.ownerId !== userId || category.horse.archived || category.horse.deletedAt) {
    return null;
  }

  const logs = await prisma.custom_logs.findMany({
    where: {
      categoryId,
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

export async function createCustomLog(categoryId: string, userId: string, data: CreateLogData) {
  // First verify the user owns the horse
  const category = await prisma.custom_log_categories.findFirst({
    where: {
      id: categoryId,
    },
    include: {
      horse: true,
    },
  });

  if (!category || category.horse.ownerId !== userId || category.horse.archived || category.horse.deletedAt) {
    return null;
  }

  const log = await prisma.custom_logs.create({
    data: {
      categoryId,
      horseId: category.horseId,
      profileId: userId,
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return log;
}

export async function updateCustomLog(logId: string, userId: string, data: Partial<CreateLogData>) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.custom_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return null;
  }

  const updatedLog = await prisma.custom_logs.update({
    where: {
      id: logId,
    },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.images && { images: data.images }),
      ...(data.imageDescriptions && { imageDescriptions: data.imageDescriptions }),
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return updatedLog;
}

export async function deleteCustomLog(logId: string, userId: string) {
  // First verify the user owns the horse that this log belongs to
  const log = await prisma.custom_logs.findFirst({
    where: {
      id: logId,
    },
    include: {
      horse: true,
    },
  });

  if (!log || log.horse.ownerId !== userId || log.horse.archived || log.horse.deletedAt) {
    return false;
  }

  await prisma.custom_logs.delete({
    where: {
      id: logId,
    },
  });

  return true;
}