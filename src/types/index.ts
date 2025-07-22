// Centralized type exports
export * from './api';
export * from './components';
export * from './services';
export * from './stable';
export * from './amenity';

// Re-export Supabase types with convenient aliases
import type { Database } from './supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type Stable = Database['public']['Tables']['stables']['Row'];
export type Box = Database['public']['Tables']['boxes']['Row'];
export type StableAmenity = Database['public']['Tables']['stable_amenities']['Row'];
export type BoxAmenity = Database['public']['Tables']['box_amenities']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Rental = Database['public']['Tables']['rentals']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type BasePrice = Database['public']['Tables']['base_prices']['Row'];
export type PricingDiscount = Database['public']['Tables']['pricing_discounts']['Row'];
export type BoxQuantityDiscount = Database['public']['Tables']['box_quantity_discounts']['Row'];
export type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];
export type StableFaq = Database['public']['Tables']['stable_faqs']['Row'];
export type PageView = Database['public']['Tables']['page_views']['Row'];
export type StableArticle = Database['public']['Tables']['stable_articles']['Row'];

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