import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { appToPrismaServiceType, type ServiceType } from '@/lib/service-types';

// TODO: These types should be generated from Prisma once service tables are added to the schema
export interface Service {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  isActive: boolean;
  advertisingActive: boolean;
  advertisingEndDate?: string | null;
  expiresAt: string;
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
  serviceId: string;
  percentage: number;
  validUntil: string;
}

export interface ServiceWithDetails extends Service {
  areas: ServiceArea[];
  photos: ServicePhoto[];
  user: {
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
        isActive: true,
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        service_areas: true,
        users: {
          select: {
            name: true,
            email: true,
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
      user: service.users
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in getAllServices:', error);
    throw new Error(`Error fetching services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get services by user ID (for user's own services)
 */
export async function getServicesByUser(userId: string): Promise<ServiceWithDetails[]> {
  try {
    const { prisma } = await import('@/services/prisma');
    
    const services = await prisma.services.findMany({
      where: {
        userId: userId
      },
      include: {
        service_areas: true,
        users: {
          select: {
            name: true,
            email: true,
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
      user: service.users
    })) as unknown as ServiceWithDetails[];
    
  } catch (error) {
    console.error('❌ Prisma error in getServicesByUser:', error);
    throw new Error(`Error fetching user services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get service by ID with full details
 */
export async function getServiceById(serviceId: string): Promise<ServiceWithDetails | null> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      areas:service_areas(*),
      photos:service_photos(*),
      user:users!services_user_id_fkey(
        name,
        email,
        phone
      )
    `)
    .eq('id', serviceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Error fetching service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return data as unknown as ServiceWithDetails;
}

/**
 * Search services with filters
 */
export async function searchServices(filters: ServiceSearchFilters): Promise<ServiceWithDetails[]> {
  let query = supabase
    .from('services')
    .select(`
      *,
      areas:service_areas(*),
      photos:service_photos(*),
      user:users!services_user_id_fkey(
        name,
        email,
        phone
      )
    `)
    .eq('isActive', true)
    .gte('expiresAt', new Date().toISOString());

  // Apply filters
  if (filters.service_type) {
    query = query.eq('serviceType', filters.service_type);
  }

  if (filters.min_price) {
    query = query.gte('price_range_min', filters.min_price);
  }

  if (filters.max_price) {
    query = query.lte('price_range_max', filters.max_price);
  }

  // For location filtering, we'll need to join with service_areas
  if (filters.county || filters.municipality) {
    // We'll filter the results after fetching since we need to check the areas array
  }

  const { data, error } = await query.order('createdAt', { ascending: false });

  if (error) {
    throw new Error(`Error searching services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  let results = data as unknown as ServiceWithDetails[];

  // Apply location filters post-query
  if (filters.county) {
    results = results.filter(service => 
      service.areas.some(area => area.county.toLowerCase().includes(filters.county!.toLowerCase()))
    );
  }

  if (filters.municipality) {
    results = results.filter(service => 
      service.areas.some(area => 
        area.municipality?.toLowerCase().includes(filters.municipality!.toLowerCase())
      )
    );
  }

  return results;
}

/**
 * Get services for a specific area (county/municipality)
 */
export async function getServicesForArea(county: string, municipality?: string): Promise<ServiceWithDetails[]> {
  return searchServices({ county, municipality });
}

/**
 * Create a new service
 */
export async function createService(serviceData: CreateServiceData, userId: string): Promise<Service> {
  // Calculate expiration date (1 month from now by default)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  // Create the service
  const { data: service, error: serviceError } = await supabaseServer
    .from('services')
    .insert({
      userId: userId,
      title: serviceData.title,
      description: serviceData.description,
      serviceType: appToPrismaServiceType(serviceData.service_type as ServiceType),
      priceRangeMin: serviceData.price_range_min,
      priceRangeMax: serviceData.price_range_max,
      contactEmail: `${userId}@temp.com`, // TODO: Get from user profile
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (serviceError) {
    console.error('❌ Supabase service creation error:', serviceError);
    console.error('❌ Service data sent:', {
      userId: userId,
      title: serviceData.title,
      description: serviceData.description,
      serviceType: serviceData.service_type,
      priceRangeMin: serviceData.price_range_min,
      priceRangeMax: serviceData.price_range_max,
      contactEmail: `${userId}@temp.com`,
      expiresAt: expiresAt.toISOString(),
      isActive: true
    });
    throw new Error(`Error creating service: ${serviceError.message}`);
  }

  // Create service areas
  if (serviceData.areas && serviceData.areas.length > 0) {
    const areaInserts = serviceData.areas.map(area => ({
      serviceId: service.id,
      county: area.county,
      municipality: area.municipality,
      updatedAt: new Date().toISOString()
    }));

    const { error: areaError } = await supabaseServer
      .from('service_areas')
      .insert(areaInserts);

    if (areaError) {
      throw new Error(`Error creating service areas: ${areaError.message}`);
    }
  }

  // Create service photos
  if (serviceData.photos && serviceData.photos.length > 0) {
    const photoInserts = serviceData.photos.map((photoUrl, index) => ({
      service_id: service.id,
      photo_url: photoUrl,
      display_order: index
    }));

    const { error: photoError } = await supabaseServer
      .from('service_photos')
      .insert(photoInserts);

    if (photoError) {
      throw new Error(`Error creating service photos: ${photoError.message}`);
    }
  }

  return service;
}

/**
 * Update a service
 */
export async function updateService(serviceId: string, serviceData: UpdateServiceData, userId: string): Promise<Service> {
  // Update the service
  const { data: service, error: serviceError } = await supabaseServer
    .from('services')
    .update({
      title: serviceData.title,
      description: serviceData.description,
      serviceType: serviceData.service_type,
      price_range_min: serviceData.price_range_min,
      price_range_max: serviceData.price_range_max,
      isActive: serviceData.is_active
    })
    .eq('id', serviceId)
    .eq('userId', userId) // Ensure user can only update their own services
    .select()
    .single();

  if (serviceError) {
    throw new Error(`Error updating service: ${serviceError.message}`);
  }

  // Update areas if provided
  if (serviceData.areas) {
    // Delete existing areas
    await supabaseServer
      .from('service_areas')
      .delete()
      .eq('service_id', serviceId);

    // Insert new areas
    if (serviceData.areas.length > 0) {
      const areaInserts = serviceData.areas.map(area => ({
        service_id: serviceId,
        county: area.county,
        municipality: area.municipality
      }));

      const { error: areaError } = await supabaseServer
        .from('service_areas')
        .insert(areaInserts);

      if (areaError) {
        throw new Error(`Error updating service areas: ${areaError.message}`);
      }
    }
  }

  // Update photos if provided
  if (serviceData.photos) {
    // Delete existing photos
    await supabaseServer
      .from('service_photos')
      .delete()
      .eq('service_id', serviceId);

    // Insert new photos
    if (serviceData.photos.length > 0) {
      const photoInserts = serviceData.photos.map((photoUrl, index) => ({
        service_id: serviceId,
        photo_url: photoUrl,
        display_order: index
      }));

      const { error: photoError } = await supabaseServer
        .from('service_photos')
        .insert(photoInserts);

      if (photoError) {
        throw new Error(`Error updating service photos: ${photoError.message}`);
      }
    }
  }

  return service;
}

/**
 * Delete a service
 */
export async function deleteService(serviceId: string, userId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('userId', userId); // Ensure user can only delete their own services

  if (error) {
    throw new Error(`Error deleting service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available service discounts
 */
export async function getServiceDiscounts(): Promise<ServiceDiscount[]> {
  const { data, error } = await supabase
    .from('service_discounts')
    .select('*')
    .eq('isActive', true)
    .order('duration_months');

  if (error) {
    throw new Error(`Error fetching service discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return data;
}

/**
 * Extend service expiration (when payment is successful)
 */
export async function extendServiceExpiration(serviceId: string, months: number): Promise<void> {
  // Get current service
  const { data: service, error: fetchError } = await supabaseServer
    .from('services')
    .select('expiresAt')
    .eq('id', serviceId)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching service: ${fetchError.message}`);
  }

  // Calculate new expiration date
  const currentExpiration = new Date(service.expiresAt);
  const now = new Date();
  
  // If service has already expired, start from now, otherwise extend from current expiration
  const startDate = currentExpiration > now ? currentExpiration : now;
  const newExpiration = new Date(startDate);
  newExpiration.setMonth(newExpiration.getMonth() + months);

  // Update the service
  const { error: updateError } = await supabaseServer
    .from('services')
    .update({ 
      expiresAt: newExpiration.toISOString(),
      isActive: true // Reactivate if it was inactive
    })
    .eq('id', serviceId);

  if (updateError) {
    throw new Error(`Error extending service expiration: ${updateError.message}`);
  }
}