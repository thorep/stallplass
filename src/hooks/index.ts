// Centralized hook exports
export * from './useStables';
export * from './useAmenities';
export * from './useRealTimeRental';

// Re-export commonly used hooks from other locations
export { useAuth } from '@/lib/supabase-auth-context';