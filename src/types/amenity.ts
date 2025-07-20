import { Database } from './supabase';

// Use Supabase-generated types directly
export type StableAmenity = Database['public']['Tables']['stable_amenities']['Row'];
export type BoxAmenity = Database['public']['Tables']['box_amenities']['Row'];