import { type ServiceType } from '@/lib/service-types';

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
  countyName?: string;
  municipalityName?: string;
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
  service_type?: ServiceType;
  county?: string;
  municipality?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ServiceSearchResponse {
  services: ServiceWithDetails[];
  total: number;
  hasMore: boolean;
}