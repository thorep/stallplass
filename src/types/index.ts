// Centralized type exports
export * from './api';
export * from './components';
export * from './services';
export * from './stable';
export * from './amenity';

// Re-export Supabase types with convenient aliases
import type { Database } from './supabase';

export type User = Database['public']['Tables']['brukere']['Row'];
export type Stable = Database['public']['Tables']['staller']['Row'];
export type Box = Database['public']['Tables']['stallplasser']['Row'];
export type StableAmenity = Database['public']['Tables']['stall_fasiliteter']['Row'];
export type BoxAmenity = Database['public']['Tables']['stallplass_fasiliteter']['Row'];
export type Conversation = Database['public']['Tables']['samtaler']['Row'];
export type Message = Database['public']['Tables']['meldinger']['Row'];
export type Rental = Database['public']['Tables']['utleie']['Row'];
export type Payment = Database['public']['Tables']['betalinger']['Row'];
export type Review = Database['public']['Tables']['anmeldelser']['Row'];
export type BasePrice = Database['public']['Tables']['base_prices']['Row'];
export type PricingDiscount = Database['public']['Tables']['pricing_discounts']['Row'];
export type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];
export type StableFaq = Database['public']['Tables']['stall_ofte_spurte_sporsmal']['Row'];
export type PageView = Database['public']['Tables']['page_views']['Row'];

// Enum types
export type BoxType = Database['public']['Enums']['box_type'];
export type ConversationStatus = Database['public']['Enums']['conversation_status'];
export type EntityType = Database['public']['Enums']['entity_type'];
export type MessageType = Database['public']['Enums']['message_type'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type RentalStatus = Database['public']['Enums']['rental_status'];
export type RevieweeType = Database['public']['Enums']['reviewee_type'];
export type RoadmapPriority = Database['public']['Enums']['roadmap_priority'];
export type RoadmapStatus = Database['public']['Enums']['roadmap_status'];