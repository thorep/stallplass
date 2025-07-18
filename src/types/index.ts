// Centralized type exports
export * from './api';
export * from './components';
export * from './services';
export * from './stable';
export * from './amenity';

// Re-export commonly used Prisma types
export type { 
  User, 
  Stable, 
  Box, 
  StableAmenity, 
  BoxAmenity,
  Conversation,
  Message,
  Rental
} from '@prisma/client';