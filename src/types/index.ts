// Centralized type exports
export * from './api';
export * from './components';
export * from './services';
export * from './stable';
export * from './amenity';

// Re-export Prisma types with convenient aliases
import type {
  users,
  stables,
  boxes,
  stable_amenities,
  box_amenities,
  conversations,
  messages,
  payments,
  base_prices,
  pricing_discounts,
  roadmap_items,
  stable_faqs,
  page_views,
  BoxType,
  ConversationStatus,
  EntityType,
  MessageType,
  PaymentMethod,
  PaymentStatus,
  RoadmapPriority,
  RoadmapStatus
} from '@/generated/prisma';

export type User = users;
export type Stable = stables;
export type Box = boxes;
export type StableAmenity = stable_amenities;
export type BoxAmenity = box_amenities;
export type Conversation = conversations;
export type Message = messages;
export type Payment = payments;
export type BasePrice = base_prices;
export type PricingDiscount = pricing_discounts;
export type RoadmapItem = roadmap_items;
export type StableFaq = stable_faqs;
export type PageView = page_views;

// Enum types
export type { BoxType, ConversationStatus, EntityType, MessageType, PaymentMethod, PaymentStatus, RoadmapPriority, RoadmapStatus };