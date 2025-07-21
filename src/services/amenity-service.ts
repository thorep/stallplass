import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

type StableAmenity = Tables<'stable_amenities'>;
type BoxAmenity = Tables<'box_amenities'>;

/**
 * Get all stable amenities
 */
export async function getAllStableAmenities(): Promise<StableAmenity[]> {
  const { data, error } = await supabase
    .from('stable_amenities')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get all box amenities
 */
export async function getAllBoxAmenities(): Promise<BoxAmenity[]> {
  const { data, error } = await supabase
    .from('box_amenities')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}