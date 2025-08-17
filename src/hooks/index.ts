// Centralized hook exports

// Re-export commonly used hooks from other locations
// export { useAuth } from "@/lib/supabase-auth-context"; // DEPRECATED - use useSupabaseUser instead
export { useSupabaseUser } from "./useSupabaseUser";

// Data fetching and management hooks
export * from "./useAdminQueries";
export * from "./useAdminStats";
export * from "./useAmenities";
export * from "./useBoxes";
export * from "./useHorseSales";
export * from "./usePartLoanHorses";
export * from "./useServices";
export * from "./useStables";
// Location hooks (specific exports to avoid conflicts)
export {
  useFylker,
  useKommuner,
  useLocationDetails,
  useLocationLookup,
  usePostalCodeLookup,
  useTettsteder,
} from "./useLocationQueries";
export * from "./useUser"; // Contains both useProfile and useUser (legacy)

// Mutation hooks (excluding conflicting optimistic update functions)
export {
  useBatchStableOperations,
  useCreateStable,
  useDeleteStable,
  useUpdateStable,
} from "./useStableMutations";

export {
  useBatchBoxOperations,
  useCreateBox,
  useCreateBoxServer,
  useDeleteBox,
  usePurchaseSponsoredPlacement,
  useSponsoredPlacementInfo,
  useUpdateBox,
  // useUpdateBoxAvailability, // TODO: Uncomment when API endpoint is implemented
  useUpdateBoxAvailabilityStatus,
} from "./useBoxMutations";

export {
  useBatchServiceOperations,
  useCreateService,
  useDeleteService,
  useServicePaymentMutations,
  useToggleServiceStatus,
  useUpdateService,
  useUpdateServicePhotos,
} from "./useServiceMutations";

// Query hooks (with specific exports to avoid conflicts)
export { useSponsoredPlacements } from "./useBoxQueries";

export * from "./useAdminCleanup";
export * from "./useAnalytics";
export * from "./useChat";
export * from "./useConversations";
export * from "./useFAQs";
export * from "./useForum";
export {
  useGetFylker,
  useGetKommuner,
  useGetTettsteder,
  useSearchLocations as useLocationSearch,
} from "./useLocations";
export * from "./usePriceRanges";
export * from "./useUploads";

// Stable owner hooks (excluding conflicting ones)
export {
  useBoxOccupancy,
  useRevenueTrends,
  useStableOwnerActivityFeed,
  useStableOwnerDashboard,
  useStableOwnerPayments,
  useStableOwnerSummary,
} from "./useStableOwner";

// Profile-specific hook exports (for clarity and new naming conventions)
export { useAdminProfiles, useDeleteProfileAdmin, useUpdateProfileAdmin } from "./useAdminQueries";
export {
  useCurrentProfile,
  useCurrentUser,
  useProfileConversations,
  useUserConversations,
} from "./useChat";
export { useProfile, useUser } from "./useUser";
