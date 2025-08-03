import { prisma } from './prisma';
import type { service_types } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Get all service types
 */
export async function getAllServiceTypes(): Promise<service_types[]> {
  try {
    const serviceTypes = await prisma.service_types.findMany({
      orderBy: {
        displayName: 'asc'
      }
    });
    return serviceTypes;
  } catch {
    throw new Error('Failed to fetch service types');
  }
}

/**
 * Get active service types only
 */
export async function getActiveServiceTypes(): Promise<service_types[]> {
  try {
    const serviceTypes = await prisma.service_types.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });
    return serviceTypes;
  } catch {
    throw new Error('Failed to fetch active service types');
  }
}

// ============ ADMIN CRUD OPERATIONS ============

/**
 * Create a new service type
 */
export async function createServiceType(data: {
  name: string;
  displayName: string;
  isActive?: boolean;
}): Promise<service_types> {
  try {
    const serviceType = await prisma.service_types.create({
      data: {
        name: data.name.trim(),
        displayName: data.displayName.trim(),
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      }
    });
    return serviceType;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A service type with this name already exists');
    }
    throw new Error('Failed to create service type');
  }
}

/**
 * Update a service type
 */
export async function updateServiceType(
  id: string, 
  data: {
    name?: string;
    displayName?: string;
    isActive?: boolean;
  }
): Promise<service_types> {
  try {
    const updateData: Partial<{
      name: string;
      displayName: string;
      isActive: boolean;
      updatedAt: Date;
    }> = {
      updatedAt: new Date()
    };

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim();
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const serviceType = await prisma.service_types.update({
      where: { id },
      data: updateData
    });
    return serviceType;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A service type with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Service type not found');
      }
    }
    throw new Error('Failed to update service type');
  }
}

/**
 * Delete a service type (with protection if in use)
 */
export async function deleteServiceType(id: string): Promise<void> {
  try {
    // First check if any services are using this service type
    const servicesUsingType = await prisma.services.count({
      where: { serviceTypeId: id }
    });

    if (servicesUsingType > 0) {
      throw new Error(`Cannot delete service type: ${servicesUsingType} service(s) are currently using this type`);
    }

    await prisma.service_types.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new Error('Service type not found');
    }
    // Re-throw known business logic errors
    if (error instanceof Error && error.message.includes('Cannot delete service type')) {
      throw error;
    }
    throw new Error('Failed to delete service type');
  }
}

/**
 * Get service type by ID
 */
export async function getServiceTypeById(id: string): Promise<service_types | null> {
  try {
    const serviceType = await prisma.service_types.findUnique({
      where: { id }
    });
    return serviceType;
  } catch {
    throw new Error('Failed to fetch service type');
  }
}