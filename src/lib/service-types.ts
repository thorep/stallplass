// Service types used in the application
export type ServiceType = 'veterinarian' | 'farrier' | 'trainer' | 'chiropractor' | 'saddlefitter' | 'equestrian_shop';

// Helper to convert service type names to our standardized format
export const normalizeServiceType = (serviceType: string | undefined | null): ServiceType => {
  if (!serviceType) {
    throw new Error('Service type is required');
  }
  const normalized = serviceType.toLowerCase();
  // Map common variations to our standard types
  switch (normalized) {
    case 'veterinær':
    case 'veterinarian':
      return 'veterinarian';
    case 'hovslagere':
    case 'hovslager':
    case 'farrier':
      return 'farrier';
    case 'trenere':
    case 'trener':
    case 'trainer':
      return 'trainer';
    case 'kiropraktor':
    case 'chiropractor':
      return 'chiropractor';
    case 'saltilpasser':
    case 'saddlefitter':
      return 'saddlefitter';
    case 'hestebutikk':
    case 'equestrian_shop':
      return 'equestrian_shop';
    default:
      return serviceType as ServiceType;
  }
};

// Temporary compatibility functions (deprecated - use normalizeServiceType instead)
export const prismaToAppServiceType = (prismaType: string): ServiceType => {
  return normalizeServiceType(prismaType);
};

export const appToPrismaServiceType = (appType: ServiceType): string => {
  return appType.toUpperCase();
};

// Function to get service type ID from database - should be used in services only
export const getServiceTypeIdByName = async (serviceTypeName: ServiceType): Promise<string> => {
  const { prisma } = await import('@/services/prisma');
  const serviceType = await prisma.service_types.findUnique({
    where: { name: serviceTypeName.toUpperCase() },
    select: { id: true }
  });
  
  if (!serviceType) {
    throw new Error(`Service type not found: ${serviceTypeName}`);
  }
  
  return serviceType.id;
};

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