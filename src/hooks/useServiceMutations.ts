"use client";

import { serviceKeys } from "@/hooks/useServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * TanStack Query mutation hooks for service CRUD operations
 *
 * NOTE: These hooks are currently placeholder implementations since the
 * marketplace service functions are still using Supabase and don't have
 * full CRUD operations implemented yet.
 *
 * When the service layer is migrated to Prisma or API endpoints are created,
 * these hooks can be updated with the actual mutation functions.
 */

// Placeholder types - these will be replaced with actual Prisma types when service models are added
type CreateServiceData = {
  title: string;
  description: string;
  service_type: "veterinarian" | "farrier" | "trainer";
  price_range_min?: number;
  price_range_max?: number;
  areas: {
    county: string;
    municipality?: string;
  }[];
  photos?: string[];
};

type UpdateServiceData = Partial<CreateServiceData> & {
  is_active?: boolean;
};

type ServiceData = {
  id: string;
  title: string;
  description: string;
  service_type: "veterinarian" | "farrier" | "trainer";
  price_range_min?: number;
  price_range_max?: number;
  is_active: boolean;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
};

type PaymentData = {
  amount: number;
  serviceId: string;
  duration: number;
};

type UpdateServicePayload = { id: string; data: UpdateServiceData };
type ApplyDiscountPayload = { serviceId: string; discountCode: string };

/**
 * Create a new service mutation
 * TODO: Implement when createService function is available
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      // TODO: Replace with actual createService call when available
      throw new Error("createService function not yet implemented");

      // Future implementation:
      // return createService(data);
    },
    onSuccess: (newService: ServiceData) => {
      // Invalidate service lists to show the new service
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });

      // Set the new service in cache
      if (newService?.id) {
        queryClient.setQueryData(serviceKeys.detail(newService.id), newService);
      }

      // Invalidate search results since they might include this service
      queryClient.invalidateQueries({ queryKey: serviceKeys.search({}) });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Update an existing service mutation
 * TODO: Implement when updateService function is available
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateServicePayload) => {
      // TODO: Replace with actual updateService call when available
      throw new Error("updateService function not yet implemented");

      // Future implementation:
      // return updateService(id, data);
    },
    onSuccess: (updatedService: ServiceData, variables: UpdateServicePayload) => {
      // Update the specific service in cache
      queryClient.setQueryData(serviceKeys.detail(variables.id), updatedService);

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });

      // Invalidate search results that might include this service
      queryClient.invalidateQueries({ queryKey: serviceKeys.search({}) });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Delete a service mutation
 * TODO: Implement when deleteService function is available
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with actual deleteService call when available
      throw new Error("deleteService function not yet implemented");

      // Future implementation:
      // return deleteService(id);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches for this service
      await queryClient.cancelQueries({ queryKey: serviceKeys.detail(deletedId) });

      // Get the service data before deletion for potential rollback
      const previousService = queryClient.getQueryData(serviceKeys.detail(deletedId));

      return { previousService };
    },
    onSuccess: (_, deletedId) => {
      // Remove the service from cache
      queryClient.removeQueries({ queryKey: serviceKeys.detail(deletedId) });

      // Invalidate all service lists since this service should no longer appear
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
    onError: (error, deletedId, context) => {

      // Restore the service in cache if we had it
      if (context?.previousService) {
        queryClient.setQueryData(serviceKeys.detail(deletedId), context.previousService);
      }
    },
    throwOnError: false,
  });
}

/**
 * Toggle service active status
 * TODO: Implement when service update functionality is available
 */
export function useToggleServiceStatus() {
  const updateService = useUpdateService();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return updateService.mutateAsync({
        id,
        data: { is_active: isActive },
      });
    },
    throwOnError: false,
  });
}

/**
 * Update service photos
 * TODO: Implement when photo management is available
 */
export function useUpdateServicePhotos() {
  const updateService = useUpdateService();

  return useMutation({
    mutationFn: async ({ id, photos }: { id: string; photos: string[] }) => {
      return updateService.mutateAsync({
        id,
        data: { photos },
      });
    },
    throwOnError: false,
  });
}

/**
 * Optimistic update helpers for service data
 */
export function useOptimisticServiceUpdate() {
  const queryClient = useQueryClient();

  return {
    /**
     * Optimistically update a service in cache
     */
    updateServiceOptimistically: (
      serviceId: string,
      updater: (old: ServiceData | undefined) => ServiceData | undefined
    ) => {
      queryClient.setQueryData(serviceKeys.detail(serviceId), updater);
    },

    /**
     * Revert optimistic update by refetching from server
     */
    revertServiceUpdate: (serviceId: string) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceId) });
    },

    /**
     * Update service active status optimistically
     */
    updateStatusOptimistically: (serviceId: string, isActive: boolean) => {
      queryClient.setQueryData(serviceKeys.detail(serviceId), (old: ServiceData | undefined) =>
        old ? { ...old, is_active: isActive } : old
      );
    },

    /**
     * Update service pricing optimistically
     */
    updatePricingOptimistically: (serviceId: string, priceMin?: number, priceMax?: number) => {
      queryClient.setQueryData(serviceKeys.detail(serviceId), (old: ServiceData | undefined) =>
        old
          ? {
              ...old,
              ...(priceMin !== undefined && { price_range_min: priceMin }),
              ...(priceMax !== undefined && { price_range_max: priceMax }),
            }
          : old
      );
    },
  };
}

/**
 * Batch service operations
 */
export function useBatchServiceOperations() {
  const queryClient = useQueryClient();

  return {
    /**
     * Invalidate all service-related caches
     */
    invalidateAllServices: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },

    /**
     * Clear all service caches (force refetch)
     */
    clearAllServiceCaches: () => {
      queryClient.removeQueries({ queryKey: serviceKeys.all });
    },

    /**
     * Prefetch service for performance
     */
    prefetchService: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: serviceKeys.detail(id),
        queryFn: () =>
          import("@/services/marketplace-service-client").then((m) => m.getServiceById(id)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },

    /**
     * Invalidate services for a specific area
     */
    invalidateServicesForArea: (county: string, municipality?: string) => {
      queryClient.invalidateQueries({
        queryKey: [...serviceKeys.all, "by-area", county, municipality],
      });
    },
  };
}

/**
 * Service payment and billing mutations
 * TODO: Implement when payment functionality is available
 */
export function useServicePaymentMutations() {
  const queryClient = useQueryClient();

  return {
    /**
     * Process service payment
     */
    processPayment: useMutation({
      mutationFn: async (paymentData: PaymentData) => {
        // TODO: Implement payment processing
        throw new Error("Service payment processing not yet implemented");
      },
      throwOnError: false,
    }),

    /**
     * Apply discount to service
     */
    applyDiscount: useMutation({
      mutationFn: async () => {
        // TODO: Implement discount application
        throw new Error("Service discount application not yet implemented");
      },
      onSuccess: (_, variables: ApplyDiscountPayload) => {
        // Invalidate service data to reflect discount
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) });
      },
      throwOnError: false,
    }),
  };
}
