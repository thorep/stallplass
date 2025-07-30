import { supabase } from '@/lib/supabase';

// Types for marketplace services
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
  priceRangeMin?: number;
  priceRangeMax?: number;
}

export interface ServiceArea {
  id: string;
  serviceId: string;
  county: string;
  municipality: string;
}

export interface ServicePhoto {
  id: string;
  serviceId: string;
  url: string;
  photoUrl: string;
  description?: string;
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

export interface ServiceSearchFilters {
  service_type?: import('@/lib/service-types').ServiceType;
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
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return data as unknown as ServiceWithDetails[];
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
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString());

  // Apply filters
  if (filters.service_type) {
    query = query.eq('service_type', filters.service_type);
  }

  if (filters.min_price) {
    query = query.gte('priceRangeMin', filters.min_price);
  }

  if (filters.max_price) {
    query = query.lte('priceRangeMax', filters.max_price);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

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