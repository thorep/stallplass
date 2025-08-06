"use client";

import { boxKeys } from "@/hooks/useBoxes";
import { stableKeys } from "@/hooks/useStables";
import { useAuth } from "@/lib/supabase-auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types for create/update operations
export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  boxType: "BOKS" | "UTEGANG";
  isAvailable: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  stableId: string;
  amenityIds?: string[];
}

export interface UpdateBoxData {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  boxType?: "BOKS" | "UTEGANG";
  isAvailable?: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  amenityIds?: string[];
  // Note: stableId is intentionally excluded as boxes should not change stable ownership
}

/**
 * TanStack Query mutation hooks for box CRUD operations
 * These hooks provide optimistic updates, cache invalidation, and error handling
 */

/**
 * Create a new box mutation (client-side)
 */
export function useCreateBox() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoxData) => {
      const token = await getIdToken();
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create box: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (newBox) => {
      // Invalidate box lists to show the new box
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: boxKeys.all });

      // If we have stable ID, invalidate stable-specific box queries
      if (newBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(newBox.stableId) });

        // Invalidate stable stats since box count changed
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        queryClient.invalidateQueries({ queryKey: stableKeys.detail(newBox.stableId) });
      }

      // Set the new box in cache
      queryClient.setQueryData(boxKeys.detail(newBox.id), newBox);
    },
    throwOnError: false,
  });
}

/**
 * Create a new box mutation (server-side with elevated permissions)
 * Note: This should be used in server components/API routes, not client components
 * For client-side box creation, use useCreateBox instead
 */
export function useCreateBoxServer() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoxData) => {
      const token = await getIdToken();
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create box: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (newBox) => {
      // Same cache invalidation as client-side creation
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: boxKeys.all });

      if (newBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        queryClient.invalidateQueries({ queryKey: stableKeys.detail(newBox.stableId) });
      }

      queryClient.setQueryData(boxKeys.detail(newBox.id), newBox);
    },
    onError: (error) => {
      // Error handling - TanStack Query will handle the error state
    },
    throwOnError: false,
  });
}

/**
 * Update an existing box mutation
 */
export function useUpdateBox() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBoxData) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${data.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update box: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (updatedBox, variables) => {
      // Update the specific box in cache
      queryClient.setQueryData(boxKeys.detail(variables.id), updatedBox);

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });

      // If we have stable ID, invalidate stable-specific queries
      if (updatedBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(updatedBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(updatedBox.stableId) });

        // Invalidate stable stats in case pricing or availability changed
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
      }
    },
    onError: (error) => {
      // Error handling - TanStack Query will handle the error state
    },
    throwOnError: false,
  });
}

/**
 * Delete a box mutation (soft delete)
 */
export function useDeleteBox() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete box: ${response.statusText}`);
      }

      return response.json();
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches for this box
      await queryClient.cancelQueries({ queryKey: boxKeys.detail(deletedId) });

      // Get the box data before deletion for potential rollback
      const previousBox = queryClient.getQueryData(boxKeys.detail(deletedId));

      return { previousBox };
    },
    onSuccess: (_, deletedId, context) => {
      // Remove the box from cache
      queryClient.removeQueries({ queryKey: boxKeys.detail(deletedId) });

      // Invalidate all box lists since this box should no longer appear
      queryClient.invalidateQueries({ queryKey: boxKeys.all });

      // If we had the box data, invalidate stable-specific queries
      if (context?.previousBox) {
        const box = context.previousBox as { stableId?: string };
        if (box.stableId) {
          queryClient.invalidateQueries({ queryKey: boxKeys.byStable(box.stableId) });
          queryClient.invalidateQueries({ queryKey: boxKeys.stats(box.stableId) });
          queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        }
      }
    },
    onError: (error, deletedId, context) => {
      // Restore the box in cache if we had it
      if (context?.previousBox) {
        queryClient.setQueryData(boxKeys.detail(deletedId), context.previousBox);
      }
    },
    throwOnError: false,
  });
}

/**
 * Restore an archived box mutation
 */
export function useRestoreBox() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${id}/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to restore box: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, restoredId) => {
      // Remove the box from cache to force refetch with updated data
      queryClient.removeQueries({ queryKey: boxKeys.detail(restoredId) });

      // Invalidate all box lists since this box should now appear again
      queryClient.invalidateQueries({ queryKey: boxKeys.all });

      // Invalidate stable queries to update counts
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
    onError: (error) => {
      // Error handling - TanStack Query will handle the error state
    },
    throwOnError: false,
  });
}

/**
 * Purchase sponsored placement for a box
 */
export function usePurchaseSponsoredPlacement() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boxId, days }: { boxId: string; days: number }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/sponsored`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Failed to purchase sponsored placement: ${response.statusText}`
        );
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), data.box);

      // Invalidate lists since sponsored status affects ordering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });

      // Invalidate stable-specific queries
      if (data.box?.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(data.box.stableId) });
      }
    },
    onError: (error) => {
      // Error handling - TanStack Query will handle the error state
    },
    throwOnError: false,
  });
}

/**
 * Get sponsored placement info for a box (query)
 */
export function useGetSponsoredPlacementInfo(boxId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: ["boxes", boxId, "sponsored-info"],
    queryFn: async () => {
      if (!boxId) throw new Error("Box ID is required");

      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/sponsored`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Failed to get sponsored placement info: ${response.statusText}`
        );
      }
      return response.json();
    },
    enabled: !!boxId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get sponsored placement info for a box (mutation - deprecated, use useGetSponsoredPlacementInfo)
 */
export function useSponsoredPlacementInfo(boxId: string | undefined) {
  const { getIdToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!boxId) throw new Error("Box ID is required");

      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/sponsored`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Failed to get sponsored placement info: ${response.statusText}`
        );
      }

      return response.json();
    },
    throwOnError: false,
  });
}

/**
 * Update box availability date
 */
export function useUpdateBoxAvailabilityDate() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      availabilityDate,
    }: {
      boxId: string;
      availabilityDate: string | null;
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/availability-date`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ availabilityDate }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Failed to update box availability date: ${response.statusText}`
        );
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), data.box);

      // Invalidate lists since availability affects filtering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });

      // Invalidate stable-specific queries
      if (data.box?.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(data.box.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(data.box.stableId) });
      }
    },
    onError: (error) => {
      // Error handling - TanStack Query will handle the error state
    },
    throwOnError: false,
  });
}

/**
 * Update box availability status (isAvailable boolean)
 */
export function useUpdateBoxAvailabilityStatus() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boxId, isAvailable }: { boxId: string; isAvailable: boolean }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/availability`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAvailable }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Failed to update box availability: ${response.statusText}`
        );
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), data.box);

      // Invalidate lists since availability affects filtering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });

      // Invalidate stable-specific queries
      if (data.box?.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(data.box.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(data.box.stableId) });
      }
    },
    onError: () => {},
    throwOnError: false,
  });
}

/**
 * Optimistic update helpers for box data
 */
export function useOptimisticBoxUpdate() {
  const queryClient = useQueryClient();

  return {
    /**
     * Optimistically update a box in cache
     */
    updateBoxOptimistically: (boxId: string, updater: (old: unknown) => unknown) => {
      queryClient.setQueryData(boxKeys.detail(boxId), updater);
    },

    /**
     * Revert optimistic update by refetching from server
     */
    revertBoxUpdate: (boxId: string) => {
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(boxId) });
    },

    /**
     * Update box availability optimistically
     */
    updateAvailabilityOptimistically: (boxId: string, isAvailable: boolean) => {
      queryClient.setQueryData(boxKeys.detail(boxId), (old: unknown) =>
        old && typeof old === "object" ? { ...(old as object), isAvailable } : old
      );
    },
  };
}

/**
 * Batch box operations
 */
export function useBatchBoxOperations() {
  const queryClient = useQueryClient();

  return {
    /**
     * Invalidate all box-related caches
     */
    invalidateAllBoxes: () => {
      queryClient.invalidateQueries({ queryKey: boxKeys.all });
    },

    /**
     * Clear all box caches (force refetch)
     */
    clearAllBoxCaches: () => {
      queryClient.removeQueries({ queryKey: boxKeys.all });
    },

    /**
     * Invalidate boxes for a specific stable
     */
    invalidateStableBoxes: (stableId: string) => {
      queryClient.invalidateQueries({ queryKey: boxKeys.byStable(stableId) });
      queryClient.invalidateQueries({ queryKey: boxKeys.stats(stableId) });
    },

    /**
     * Prefetch box for performance
     */
    prefetchBox: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: boxKeys.detail(id),
        queryFn: () => import("@/services/box-service").then((m) => m.getBoxById(id)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  };
}
