// Centralized hook exports

// Re-export commonly used hooks from other locations
export { useAuth } from '@/lib/supabase-auth-context';

// Data fetching and management hooks
export * from './useStables';
export * from './useBoxes';
export * from './useServices';
export * from './useAmenities';
export * from './useAdminQueries';
export * from './useAdminStats';
// Location hooks (specific exports to avoid conflicts)
export {
  useFylker,
  useKommuner, 
  useTettsteder,
  useLocationLookup,
  useLocationDetails,
  usePostalCodeLookup
} from './useLocationQueries';
export * from './useUser'; // Contains both useProfile and useUser (legacy)

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
  // useUpdateBoxAvailability, // TODO: Uncomment when API endpoint is implemented
  useUpdateBoxAvailabilityStatus,
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
export * from './useFAQs';
export * from './useInvoiceRequests';
export * from './useAnalytics';
export * from './useSuggestions';
export * from './useUploads';
export * from './useConversations';
export * from './usePricing';
export * from './usePriceRanges';
export * from './useAdminCleanup';
export {
  useSearchLocations as useLocationSearch,
  useGetFylker,
  useGetKommuner,
  useGetTettsteder
} from './useLocations';

// Stable owner hooks (excluding conflicting ones)
export {
  useStableOwnerDashboard,
  useStableOwnerPayments,
  useStableOwnerSummary,
  useStableOwnerActivityFeed,
  useBoxOccupancy,
  useRevenueTrends
} from './useStableOwner';

// Profile-specific hook exports (for clarity and new naming conventions)
export { useProfile, useUser } from './useUser';
export { useGetProfileInvoiceRequests, useGetUserInvoiceRequests } from './useInvoiceRequests';
export { useProfileConversations, useUserConversations } from './useChat';
export { useCurrentProfile, useCurrentUser } from './useChat';
export { useAdminProfiles, useUpdateProfileAdmin, useDeleteProfileAdmin } from './useAdminQueries';