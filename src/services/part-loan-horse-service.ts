import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export interface CreatePartLoanHorseData {
  name: string;
  description: string;
  address: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  kommuneNumber?: string; // Official kommune number for lookup
  images: string[];
  imageDescriptions: string[];
  userId: string;
}

export interface UpdatePartLoanHorseData {
  name?: string;
  description?: string;
  address?: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  kommuneNumber?: string; // Official kommune number for lookup
  images?: string[];
  imageDescriptions?: string[];
}

export async function createPartLoanHorse(data: CreatePartLoanHorseData) {
  // Map kommune number to countyId and municipalityId if available
  let countyId = data.countyId || null;
  let municipalityId = data.municipalityId || null;

  // Always do the lookup if we have a kommuneNumber to ensure we get the IDs
  if (data.kommuneNumber) {
    try {
      const municipalityData = await prisma.municipalities.findFirst({
        where: {
          municipalityNumber: data.kommuneNumber,
        },
        include: {
          counties: true,
        },
      });

      if (municipalityData) {
        // Always use the lookup results to ensure we have the IDs
        countyId = municipalityData.countyId;
        municipalityId = municipalityData.id;
      }
    } catch {
      // Continue with creation even if location mapping fails
      // Set IDs to null if lookup fails
      countyId = null;
      municipalityId = null;
    }
  }

  // Create the part-loan horse with validated IDs
  const { kommuneNumber, ...createData } = data; // Remove kommuneNumber from data
  
  return await prisma.part_loan_horses.create({
    data: {
      ...createData,
      countyId,
      municipalityId,
    },
    include: {
      profiles: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true,
        },
      },
      counties: {
        select: {
          id: true,
          name: true,
          countyNumber: true,
        },
      },
      municipalities: {
        select: {
          id: true,
          name: true,
          municipalityNumber: true,
        },
      },
    },
  });
}

export async function getPartLoanHorsesByUser(userId: string) {
  return await prisma.part_loan_horses.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      profiles: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true,
        },
      },
      counties: {
        select: {
          id: true,
          name: true,
          countyNumber: true,
        },
      },
      municipalities: {
        select: {
          id: true,
          name: true,
          municipalityNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPartLoanHorseById(id: string) {
  return await prisma.part_loan_horses.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      profiles: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true,
        },
      },
      counties: {
        select: {
          id: true,
          name: true,
          countyNumber: true,
        },
      },
      municipalities: {
        select: {
          id: true,
          name: true,
          municipalityNumber: true,
        },
      },
    },
  });
}

export async function updatePartLoanHorse(
  id: string,
  data: UpdatePartLoanHorseData,
  userId: string
) {
  const partLoanHorse = await prisma.part_loan_horses.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
  });

  if (!partLoanHorse) {
    return null;
  }

  // Map kommune number to countyId and municipalityId if available - same logic as create
  let countyId = data.countyId || null;
  let municipalityId = data.municipalityId || null;

  // Always do the lookup if we have a kommuneNumber to ensure we get the IDs
  if (data.kommuneNumber) {
    try {
      const municipalityData = await prisma.municipalities.findFirst({
        where: {
          municipalityNumber: data.kommuneNumber,
        },
        include: {
          counties: true,
        },
      });

      if (municipalityData) {
        // Always use the lookup results to ensure we have the IDs
        countyId = municipalityData.countyId;
        municipalityId = municipalityData.id;
      }
    } catch {
      // Continue with update even if location mapping fails
      // Keep existing values if lookup fails
      countyId = data.countyId || null;
      municipalityId = data.municipalityId || null;
    }
  }

  // Remove kommuneNumber from update data
  const { kommuneNumber, ...updateData } = data;

  return await prisma.part_loan_horses.update({
    where: { id },
    data: {
      ...updateData,
      countyId,
      municipalityId,
      updatedAt: new Date(),
    },
    include: {
      profiles: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true,
        },
      },
      counties: {
        select: {
          id: true,
          name: true,
          countyNumber: true,
        },
      },
      municipalities: {
        select: {
          id: true,
          name: true,
          municipalityNumber: true,
        },
      },
    },
  });
}

export async function deletePartLoanHorse(id: string, userId: string) {
  const partLoanHorse = await prisma.part_loan_horses.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
  });

  if (!partLoanHorse) {
    return false;
  }

  await prisma.part_loan_horses.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  return true;
}

export async function incrementPartLoanHorseViewCount(id: string) {
  return await prisma.part_loan_horses.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}