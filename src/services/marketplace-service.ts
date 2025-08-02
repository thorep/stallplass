import { appToPrismaServiceType, type ServiceType } from '@/lib/service-types';
import type { ServiceType as PrismaServiceType } from '@/generated/prisma';

// TODO: These types should be generated from Prisma once service tables are added to the schema
export interface Service {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  isActive: boolean;
  advertisingActive: boolean;
  advertisingEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  county: string;
  municipality: string;
  price: number;
  contactEmail: string;
  contactPhone?: string;
}

export interface ServiceArea {
  id: string;
  serviceId: string;
  county: string;
  municipality: string;
  countyName?: string;
  municipalityName?: string;
}

export interface ServicePhoto {
  id: string;
  serviceId: string;
  url: string;
  description?: string;
}

export interface ServicePayment {
  id: string;
  serviceId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface ServiceDiscount {
  id: string;
  months: number;
  percentage: number;
  isActive: boolean;
}

export interface ServiceWithDetails extends Service {
  areas: ServiceArea[];
  photos: ServicePhoto[];
  profile: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateServiceData {
  title: string;
  description: string;
  service_type: 'veterinarian' | 'farrier' | 'trainer';
  price_range_min?: number;
  price_range_max?: number;
  contact_email?: string;
  contact_phone?: string;
  areas: {
    county: string;
    municipality?: string;
  }[];
  photos?: string[]; // URLs of uploaded photos
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  is_active?: boolean;
}

export interface ServiceSearchFilters {
  service_type?: 'veterinarian' | 'farrier' | 'trainer';
  county?: string;
  municipality?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
}

/**
 * Get all active services with full details
 */
export async function getAllServices(): Promise<ServiceWithDetails[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    const services = await prisma.services.findMany({
      where: {
        isActive: true
      },
      include: {
        service_areas: true,
        profiles: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all unique county and municipality IDs
    const countyIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.county)))];
    const municipalityIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.municipality).filter(Boolean)))];
    
    // Fetch county and municipality names
    const [counties, municipalities] = await Promise.all([
      countyIds.length > 0 ? prisma.counties.findMany({
        where: { id: { in: countyIds } },
        select: { id: true, name: true }
      }) : [],
      municipalityIds.length > 0 ? prisma.municipalities.findMany({
        where: { id: { in: municipalityIds as string[] } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    // Create lookup maps
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
    
    // Transform to match ServiceWithDetails interface with location names
    return services.map(service => ({
      ...service,
      areas: service.service_areas.map(area => ({
        ...area,
        county: area.county, // Keep the ID
        municipality: area.municipality, // Keep the ID
        countyName: countyMap.get(area.county) || area.county,
        municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
      })),
      photos: [], // Will add photo support later if needed
      user: service.profiles
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in getAllServices:', error);
    throw new Error(`Error fetching services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get services by profile ID (for profile's own services)
 */
export async function getServicesByProfile(profileId: string): Promise<ServiceWithDetails[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    const services = await prisma.services.findMany({
      where: {
        userId: profileId
      },
      include: {
        service_areas: true,
        profiles: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all unique county and municipality IDs
    const countyIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.county)))];
    const municipalityIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.municipality).filter(Boolean)))];
    
    // Fetch county and municipality names
    const [counties, municipalities] = await Promise.all([
      countyIds.length > 0 ? prisma.counties.findMany({
        where: { id: { in: countyIds } },
        select: { id: true, name: true }
      }) : [],
      municipalityIds.length > 0 ? prisma.municipalities.findMany({
        where: { id: { in: municipalityIds as string[] } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    // Create lookup maps
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
    
    // Transform to match ServiceWithDetails interface with location names
    return services.map(service => ({
      ...service,
      areas: service.service_areas.map(area => ({
        ...area,
        county: area.county, // Keep the ID
        municipality: area.municipality, // Keep the ID
        countyName: countyMap.get(area.county) || area.county,
        municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
      })),
      photos: [], // Will add photo support later if needed
      user: service.profiles
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in getServicesByProfile:', error);
    throw new Error(`Error fetching profile services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get service by ID with full details
 */
export async function getServiceById(serviceId: string): Promise<ServiceWithDetails | null> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    const service = await prisma.services.findUnique({
      where: {
        id: serviceId
      },
      include: {
        service_areas: true,
        profiles: {
          select: {
            nickname: true,
            phone: true
          }
        }
      }
    });

    if (!service) {
      return null;
    }

    // Get all unique county and municipality IDs
    const countyIds = [...new Set(service.service_areas.map(a => a.county))];
    const municipalityIds = [...new Set(service.service_areas.map(a => a.municipality).filter(Boolean))];
    
    // Fetch county and municipality names
    const [counties, municipalities] = await Promise.all([
      countyIds.length > 0 ? prisma.counties.findMany({
        where: { id: { in: countyIds } },
        select: { id: true, name: true }
      }) : [],
      municipalityIds.length > 0 ? prisma.municipalities.findMany({
        where: { id: { in: municipalityIds as string[] } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    // Create lookup maps
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
    
    // Transform to match ServiceWithDetails interface with location names
    return {
      ...service,
      areas: service.service_areas.map(area => ({
        ...area,
        county: area.county, // Keep the ID
        municipality: area.municipality, // Keep the ID
        countyName: countyMap.get(area.county) || area.county,
        municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
      })),
      photos: [], // Will add photo support later if needed
      user: service.profiles
    } as unknown as ServiceWithDetails;
    
  } catch (error) {
    console.error('❌ Prisma error in getServiceById:', error);
    throw new Error(`Error fetching service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search services with filters
 */
export async function searchServices(filters: ServiceSearchFilters): Promise<ServiceWithDetails[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    // Build where conditions
    const where: {
      isActive: boolean;
      serviceType?: PrismaServiceType;
      priceRangeMin?: { gte: number };
      priceRangeMax?: { lte: number };
      service_areas?: { some: Record<string, string> };
    } = {
      isActive: true
    };

    // Apply service type filter
    if (filters.service_type) {
      where.serviceType = appToPrismaServiceType(filters.service_type as ServiceType);
    }

    // Apply price filters
    if (filters.min_price) {
      where.priceRangeMin = {
        gte: filters.min_price
      };
    }

    if (filters.max_price) {
      where.priceRangeMax = {
        lte: filters.max_price
      };
    }

    // Apply location filters using service_areas relation
    if (filters.county || filters.municipality) {
      const areaFilters: Record<string, string> = {};
      if (filters.county) {
        areaFilters.county = filters.county;
      }
      if (filters.municipality) {
        areaFilters.municipality = filters.municipality;
      }
      
      where.service_areas = {
        some: areaFilters
      };
    }

    const services = await prisma.services.findMany({
      where,
      include: {
        service_areas: true,
        profiles: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all unique county and municipality IDs
    const countyIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.county)))];
    const municipalityIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.municipality).filter(Boolean)))];
    
    // Fetch county and municipality names
    const [counties, municipalities] = await Promise.all([
      countyIds.length > 0 ? prisma.counties.findMany({
        where: { id: { in: countyIds } },
        select: { id: true, name: true }
      }) : [],
      municipalityIds.length > 0 ? prisma.municipalities.findMany({
        where: { id: { in: municipalityIds as string[] } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    // Create lookup maps
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
    
    // Transform to match ServiceWithDetails interface with location names
    return services.map(service => ({
      ...service,
      areas: service.service_areas.map(area => ({
        ...area,
        county: area.county, // Keep the ID
        municipality: area.municipality, // Keep the ID
        countyName: countyMap.get(area.county) || area.county,
        municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
      })),
      photos: [], // Will add photo support later if needed
      user: service.profiles
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in searchServices:', error);
    throw new Error(`Error searching services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get services for a specific area (county/municipality)
 */
export async function getServicesForArea(county: string, municipality?: string): Promise<ServiceWithDetails[]> {
  return searchServices({ county, municipality });
}

/**
 * Get services that cover a stable's location with hierarchical matching
 * - Exact municipality match: Service covers "Vestfold->Sandefjord" → matches stable in "Vestfold->Sandefjord"
 * - County-wide coverage: Service covers "Telemark" → matches any stable in Telemark county
 */
export async function getServicesForStable(stableCountyId: string, stableMunicipalityId?: string): Promise<ServiceWithDetails[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    // Build where conditions for hierarchical matching
    const whereConditions = [
      // 1. Exact municipality match (if stable has municipality)
      ...(stableMunicipalityId ? [{
        service_areas: {
          some: {
            county: stableCountyId,
            municipality: stableMunicipalityId
          }
        }
      }] : []),
      // 2. County-wide coverage (services that cover entire county)
      {
        service_areas: {
          some: {
            county: stableCountyId,
            OR: [
              { municipality: null },
              { municipality: "" }
            ]
          }
        }
      }
    ];

    const services = await prisma.services.findMany({
      where: {
        isActive: true,
        advertisingActive: true,
        advertisingEndDate: {
          gt: new Date()
        },
        OR: whereConditions
      },
      include: {
        service_areas: true,
        profiles: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: [
        // Prioritize exact municipality matches over county-wide coverage
        {
          service_areas: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ]
    });

    // Get all unique county and municipality IDs for name resolution
    const countyIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.county)))];
    const municipalityIds = [...new Set(services.flatMap(s => s.service_areas.map(a => a.municipality).filter(Boolean)))];
    
    // Fetch county and municipality names
    const [counties, municipalities] = await Promise.all([
      countyIds.length > 0 ? prisma.counties.findMany({
        where: { id: { in: countyIds } },
        select: { id: true, name: true }
      }) : [],
      municipalityIds.length > 0 ? prisma.municipalities.findMany({
        where: { id: { in: municipalityIds as string[] } },
        select: { id: true, name: true }
      }) : []
    ]);
    
    // Create lookup maps
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    const municipalityMap = new Map(municipalities.map(m => [m.id, m.name]));
    
    // Transform to match ServiceWithDetails interface with location names
    return services.map(service => ({
      ...service,
      areas: service.service_areas.map(area => ({
        ...area,
        county: area.county, // Keep the ID
        municipality: area.municipality, // Keep the ID
        countyName: countyMap.get(area.county) || area.county,
        municipalityName: area.municipality ? (municipalityMap.get(area.municipality) || area.municipality) : undefined
      })),
      photos: [], // Will add photo support later if needed
      user: service.profiles
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in getServicesForStable:', error);
    throw new Error(`Error fetching services for stable location: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new service
 */
export async function createService(serviceData: CreateServiceData, userId: string): Promise<Service> {
  try {
    const { prisma } = await import('@/services/prisma');

    // Create the service with areas in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the service
      const service = await tx.services.create({
        data: {
          userId: userId,
          title: serviceData.title,
          description: serviceData.description,
          serviceType: appToPrismaServiceType(serviceData.service_type as ServiceType),
          priceRangeMin: serviceData.price_range_min,
          priceRangeMax: serviceData.price_range_max,
          ...(serviceData.contact_email && { contactEmail: serviceData.contact_email }),
          ...(serviceData.contact_phone && { contactPhone: serviceData.contact_phone }),
          isActive: true,
          advertisingActive: false,
          advertisingEndDate: null,
          updatedAt: new Date()
        }
      });

      // Create service areas
      if (serviceData.areas && serviceData.areas.length > 0) {
        await tx.service_areas.createMany({
          data: serviceData.areas.map(area => ({
            serviceId: service.id,
            county: area.county,
            municipality: area.municipality,
            updatedAt: new Date()
          }))
        });
      }

      // Create service photos if provided
      if (serviceData.photos && serviceData.photos.length > 0) {
        await tx.service_photos.createMany({
          data: serviceData.photos.map((photoUrl, index) => ({
            serviceId: service.id,
            photoUrl: photoUrl,
            displayOrder: index
          }))
        });
      }

      return service;
    });

    return result as unknown as Service;
    
  } catch (error) {
    console.error('❌ Prisma error in createService:', error);
    console.error('❌ Service data sent:', {
      userId: userId,
      title: serviceData.title,
      description: serviceData.description,
      serviceType: serviceData.service_type,
      priceRangeMin: serviceData.price_range_min,
      priceRangeMax: serviceData.price_range_max,
      contactEmail: `${userId}@temp.com`,
      isActive: true
    });
    throw new Error(`Error creating service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update a service
 */
export async function updateService(serviceId: string, serviceData: UpdateServiceData, userId: string): Promise<Service> {
  try {
    const { prisma } = await import('@/services/prisma');

    // Update the service with areas in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the service
      const service = await tx.services.update({
        where: {
          id: serviceId,
          userId: userId // Ensure profile can only update their own services
        },
        data: {
          ...(serviceData.title !== undefined && { title: serviceData.title }),
          ...(serviceData.description !== undefined && { description: serviceData.description }),
          ...(serviceData.service_type !== undefined && { serviceType: appToPrismaServiceType(serviceData.service_type as ServiceType) }),
          ...(serviceData.price_range_min !== undefined && { priceRangeMin: serviceData.price_range_min }),
          ...(serviceData.price_range_max !== undefined && { priceRangeMax: serviceData.price_range_max }),
          ...(serviceData.contact_email !== undefined && { contactEmail: serviceData.contact_email }),
          ...(serviceData.contact_phone !== undefined && { contactPhone: serviceData.contact_phone }),
          ...(serviceData.is_active !== undefined && { isActive: serviceData.is_active }),
          updatedAt: new Date()
        }
      });

      // Update areas if provided
      if (serviceData.areas) {
        // Delete existing areas
        await tx.service_areas.deleteMany({
          where: { serviceId: serviceId }
        });

        // Insert new areas
        if (serviceData.areas.length > 0) {
          await tx.service_areas.createMany({
            data: serviceData.areas.map(area => ({
              serviceId: serviceId,
              county: area.county,
              municipality: area.municipality,
              updatedAt: new Date()
            }))
          });
        }
      }

      // Update photos if provided
      if (serviceData.photos) {
        // Delete existing photos
        await tx.service_photos.deleteMany({
          where: { serviceId: serviceId }
        });

        // Insert new photos
        if (serviceData.photos.length > 0) {
          await tx.service_photos.createMany({
            data: serviceData.photos.map((photoUrl, index) => ({
              serviceId: serviceId,
              photoUrl: photoUrl,
              displayOrder: index
            }))
          });
        }
      }

      return service;
    });

    return result as unknown as Service;
    
  } catch (error) {
    console.error('❌ Prisma error in updateService:', error);
    throw new Error(`Error updating service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a service
 */
export async function deleteService(serviceId: string, userId: string): Promise<void> {
  try {
    const { prisma } = await import('@/services/prisma');

    // Delete the service in a transaction (will cascade delete related records)
    await prisma.$transaction(async (tx) => {
      // Verify the service exists and belongs to the profile
      const service = await tx.services.findFirst({
        where: {
          id: serviceId,
          userId: userId
        }
      });

      if (!service) {
        throw new Error('Service not found or you do not have permission to delete it');
      }

      // Delete the service (areas and photos will be cascade deleted)
      await tx.services.delete({
        where: {
          id: serviceId
        }
      });
    });

  } catch (error) {
    console.error('❌ Prisma error in deleteService:', error);
    throw new Error(`Error deleting service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available service discounts
 */
export async function getServiceDiscounts(): Promise<ServiceDiscount[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    const discounts = await prisma.service_pricing_discounts.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        months: 'asc'
      }
    });
    
    return discounts as unknown as ServiceDiscount[];
    
  } catch (error) {
    console.error('❌ Prisma error in getServiceDiscounts:', error);
    throw new Error(`Error fetching service discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extend service advertising (when payment is successful)
 */
export async function extendServiceAdvertising(serviceId: string, months: number): Promise<void> {
  try {
    const { prisma } = await import('@/services/prisma');

    // Get current service
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
      select: { advertisingEndDate: true, advertisingActive: true }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Calculate new advertising end date
    const now = new Date();
    const currentEndDate = service.advertisingEndDate ? new Date(service.advertisingEndDate) : now;
    
    // If advertising has already expired, start from now, otherwise extend from current end date
    const startDate = currentEndDate > now ? currentEndDate : now;
    const newEndDate = new Date(startDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    // Update the service advertising
    await prisma.services.update({
      where: { id: serviceId },
      data: {
        advertisingEndDate: newEndDate,
        advertisingActive: true, // Activate advertising
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Prisma error in extendServiceAdvertising:', error);
    throw new Error(`Error extending service advertising: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}