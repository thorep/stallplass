// Centralized hook exports

// Re-export commonly used hooks from other locations
export { useAuth } from '@/lib/supabase-auth-context';

// Data fetching and management hooks
export * from './useStables';
export * from './useBoxes';
export * from './useServices';
export * from './useAmenities';
export * from './usePaymentTracking';
export * from './useRealTimePayment';
export * from './useRentalQueries';
export * from './useAdminQueries';
export * from './useAdminStats';
export * from './useLocationQueries';

// Mutation hooks (excluding conflicting optimistic update functions)
export {
  useCreateStable,
  useUpdateStable,
  useDeleteStable,
  useBatchStableOperations
} from './useStableMutations';

export {
  useCreateBox,
  useCreateBoxServer,
  useUpdateBox,
  useDeleteBox,
  usePurchaseSponsoredPlacement,
  useSponsoredPlacementInfo,
  useUpdateBoxAvailability,
  useBatchBoxOperations
} from './useBoxMutations';

export {
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleServiceStatus,
  useUpdateServicePhotos,
  useBatchServiceOperations,
  useServicePaymentMutations
} from './useServiceMutations';

// Query hooks (with specific exports to avoid conflicts)
export {
  useBoxAvailability,
  useSponsoredPlacements,
  useBoxConflictPrevention
} from './useBoxQueries';

export * from './useChat';
export * from './useRentals';

// Stable owner hooks (excluding conflicting ones)
export {
  useStableOwnerDashboard,
  useStableOwnerRentalsRealTime,
  useStableOwnerPayments,
  useStableOwnerSummary,
  useStableOwnerActivityFeed,
  useBoxOccupancy,
  useRevenueTrends
} from './useStableOwner';