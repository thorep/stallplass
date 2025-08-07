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
  createdAt: string;
  updatedAt: string;
  profileId: string;
  county: string;
  municipality: string;
  price: number;
  contactName: string;
  contactEmail?: string;
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

export interface ServiceWithDetails extends Service {
  areas: ServiceArea[];
  images?: string[];
  profile: {
    nickname: string;
    phone?: string;
  };
  isOwnerView?: boolean;
  requiresAdvertising?: boolean;
  userId?: string;
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