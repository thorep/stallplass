import { Database } from './supabase';

// Use Supabase-generated types directly
export type StableAmenity = Database['public']['Tables']['stall_fasiliteter']['Row'];
export type BoxAmenity = Database['public']['Tables']['stallplass_fasiliteter']['Row'];