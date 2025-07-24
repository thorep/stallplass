/**
 * English stable management hooks using Supabase types
 * Comprehensive stable CRUD operations with real-time features
 */

import { getStableById, getStablesByOwner } from "@/services/stable-service-client";
import { TablesInsert, TablesUpdate } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";
// Note: createStable, updateStable, deleteStable require server-side operations via API routes

// Query Keys
export const stableKeys = {
  all: ["stables"] as const,
  withBoxStats: () => [...stableKeys.all, "withBoxStats"] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, "byOwner", ownerId] as const,
  byId: (id: string) => [...stableKeys.all, "byId", id] as const,
  search: (filters: Record<string, unknown>) => [...stableKeys.all, "search", filters] as const,
};

// Type aliases
export type CreateStableData = TablesInsert<"stables"> & {
  amenityIds?: string[];
};
export type UpdateStableData = TablesUpdate<"stables"> & {
  id: string;
  amenityIds?: string[];
};

/**
 * Get all stables with box statistics
 */
export function useStablesWithBoxStats(enabled = true) {
  return useQuery({
    queryKey: stableKeys.withBoxStats(),
    queryFn: async () => {
      const { getAllStablesWithBoxStats } = await import("@/services/stable-service-client");
      return getAllStablesWithBoxStats();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get stables by owner ID
 */
export function useStablesByOwner(ownerId?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byOwner(ownerId || ""),
    queryFn: () => (ownerId ? getStablesByOwner(ownerId) : Promise.resolve([])),
    enabled: enabled && !!ownerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get stable by ID
 */
export function useStableById(id?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byId(id || ""),
    queryFn: () => (id ? getStableById(id) : Promise.resolve(null)),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual stables
  });
}

/**
 * Search stables with filters
 */
export function useStableSearch(filters: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: stableKeys.search(filters),
    queryFn: async () => {
      const { stables } = await import("@/services/api-client");
      return stables.search(filters);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
