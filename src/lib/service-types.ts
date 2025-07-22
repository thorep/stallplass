import { Database } from '@/types/supabase';

// Use the actual database type for service_type
export type ServiceType = Database['public']['Enums']['service_type'];

// Centralized mapping for service type labels and colors
export const serviceTypeConfig: Record<ServiceType, { label: string; color: string }> = {
  veterinarian: {
    label: 'Veterinær',
    color: 'bg-blue-100 text-blue-800'
  },
  farrier: {
    label: 'Hovslagere',
    color: 'bg-orange-100 text-orange-800'
  },
  trainer: {
    label: 'Trenere', 
    color: 'bg-green-100 text-green-800'
  },
  chiropractor: {
    label: 'Kiropraktor',
    color: 'bg-purple-100 text-purple-800'
  },
  saddlefitter: {
    label: 'Saltilpasser',
    color: 'bg-yellow-100 text-yellow-800'
  },
  equestrian_shop: {
    label: 'Hestebutikk',
    color: 'bg-red-100 text-red-800'
  }
};

// Helper functions
export const getServiceTypeLabel = (type: ServiceType): string => {
  return serviceTypeConfig[type]?.label ?? type;
};

export const getServiceTypeColor = (type: ServiceType): string => {
  return serviceTypeConfig[type]?.color ?? 'bg-gray-100 text-gray-800';
};

// Get all service types for forms/filters
export const getAllServiceTypes = (): Array<{ value: ServiceType; label: string }> => {
  return Object.entries(serviceTypeConfig).map(([value, config]) => ({
    value: value as ServiceType,
    label: config.label
  }));
};