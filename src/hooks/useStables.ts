/**
 * LEGACY FILE - BACKWARD COMPATIBILITY ONLY
 * 
 * This file provides backward compatibility wrappers for existing components.
 * New code should use the Norwegian hooks from useStaller.ts instead:
 * 
 * - useStablesWithBoxStats() → useStallerMedStallplassStatistikk()
 * - useStablesByOwner() → useStallerEtterEier()
 * - useStableById() → useStallEtterId()
 * - useCreateStable() → useOpprettStall()
 * - useUpdateStable() → useOppdaterStall()
 * - useDeleteStable() → useSlettStall()
 */

import {
  useStallerMedStallplassStatistikk,
  useStallerEtterEier,
  useStallEtterId,
  useOpprettStall,
  useOppdaterStall,
  useSlettStall,
  type StallMedStallplassStatistikk,
  type StallMedFasiliteter,
  type OpprettStallData,
  type OppdaterStallData
} from './useStaller';

// Legacy Query Keys - for backward compatibility
export const stableKeys = {
  all: ['stables'] as const,
  withBoxStats: () => [...stableKeys.all, 'withBoxStats'] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, 'byOwner', ownerId] as const,
  byId: (id: string) => [...stableKeys.all, 'byId', id] as const,
  search: (filters: Record<string, unknown>) => [...stableKeys.all, 'search', filters] as const,
};

// Legacy type aliases for backward compatibility
type LegacyStableWithBoxStats = StallMedStallplassStatistikk;
type LegacyStableWithAmenities = StallMedFasiliteter;
type LegacyCreateStableData = OpprettStallData;
type LegacyUpdateStableData = OppdaterStallData;

// Export legacy types
export type {
  LegacyStableWithBoxStats as StableWithBoxStats,
  LegacyStableWithAmenities as StableWithAmenities,
  LegacyCreateStableData as CreateStableData,
  LegacyUpdateStableData as UpdateStableData
};

/**
 * LEGACY WRAPPER - Use useStallerMedStallplassStatistikk() from Norwegian hooks instead
 */
export function useStablesWithBoxStats(enabled = true) {
  return useStallerMedStallplassStatistikk(enabled);
}

/**
 * LEGACY WRAPPER - Use useStallerEtterEier() from Norwegian hooks instead
 */
export function useStablesByOwner(ownerId?: string, enabled = true) {
  return useStallerEtterEier(ownerId, enabled);
}

/**
 * LEGACY WRAPPER - Use useStallEtterId() from Norwegian hooks instead
 */
export function useStableById(id?: string, enabled = true) {
  return useStallEtterId(id, enabled);
}

/**
 * LEGACY WRAPPER - Use useOpprettStall() from Norwegian hooks instead
 */
export function useCreateStable() {
  return useOpprettStall();
}

/**
 * LEGACY WRAPPER - Use useOppdaterStall() from Norwegian hooks instead
 */
export function useUpdateStable() {
  return useOppdaterStall();
}

/**
 * LEGACY WRAPPER - Use useSlettStall() from Norwegian hooks instead
 */
export function useDeleteStable() {
  return useSlettStall();
}