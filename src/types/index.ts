// Centralized type exports
export * from './api';
export * from './components';
export * from './services';
export * from './stable';
export * from './amenity';

// Re-export Prisma types with convenient aliases
import type {
  profiles,
  stables,
  boxes,
  stable_amenities,
  box_amenities,
  conversations,
  messages,
  base_prices,
  pricing_discounts,
  stable_faqs,
  invoice_requests,
  BoxType,
  ConversationStatus,
  EntityType,
  MessageType,
  InvoiceRequestStatus,
  InvoiceItemType,
} from '@/generated/prisma';

export type Profile = profiles;
export type Stable = stables;
export type Box = boxes;
export type StableAmenity = stable_amenities;
export type BoxAmenity = box_amenities;
export type Conversation = conversations;
export type Message = messages;
export type InvoiceRequest = invoice_requests;
export type BasePrice = base_prices;
export type PricingDiscount = pricing_discounts;
export type StableFaq = stable_faqs;

// Enum types
export type { BoxType, ConversationStatus, EntityType, MessageType, InvoiceRequestStatus, InvoiceItemType };