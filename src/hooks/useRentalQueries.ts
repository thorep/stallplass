/**
 * LEGACY FILE - BACKWARD COMPATIBILITY ONLY
 * 
 * This file provides backward compatibility wrappers for existing components.
 * New code should use the Norwegian hooks from useUtleieQueries.ts instead:
 * 
 * - useMyRentals() → useMineUtleier()
 * - useStableRentals() → useStallUtleier()
 * - useAllRentals() → useAlleUtleier()
 */

import {
  useMineUtleier,
  useStallUtleier,
  useAlleUtleier,
  type UtleieMedRelasjoner,
  type Utleie,
  type Stallplass,
  type Stall,
  type Bruker
} from './useUtleieQueries';

// Legacy types for backward compatibility
type Rental = Utleie;
type Box = Stallplass;
type Stable = Stall;
type User = Bruker;
export type RentalWithRelations = UtleieMedRelasjoner;

// Export legacy types
export type {
  Rental,
  Box,
  Stable,
  User
};

// NOTE: The type now uses proper Supabase snake_case field names (start_date, end_date, monthly_price, etc.)
// Components using this type will need to be updated to use snake_case properties:
// - startDate → start_date
// - endDate → end_date  
// - monthlyPrice → monthly_price
// - box.isIndoor → box.is_indoor
// - box.hasWindow → box.has_window
// - box.hasElectricity → box.has_electricity
// - box.hasWater → box.has_water
// - box.maxHorseSize → box.max_horse_size
// - stable.ownerName → stable.owner_name
// - stable.ownerPhone → stable.owner_phone
// - stable.ownerEmail → stable.owner_email

/**
 * LEGACY WRAPPER - Use useMineUtleier() from Norwegian hooks instead
 * Hook to get rentals where user is the renter
 */
export function useMyRentals(userId: string | undefined) {
  return useMineUtleier(userId);
}

/**
 * LEGACY WRAPPER - Use useStallUtleier() from Norwegian hooks instead
 * Hook to get rentals where user is the stable owner
 */
export function useStableRentals(userId: string | undefined) {
  return useStallUtleier(userId);
}

/**
 * LEGACY WRAPPER - Use useAlleUtleier() from Norwegian hooks instead
 * Hook to get both renter and owner rentals
 */
export function useAllRentals(userId: string | undefined) {
  return useAlleUtleier(userId);
}