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
  stable_faqs,
  BoxType,
  ConversationStatus,
  EntityType,
  MessageType,
} from '@/generated/prisma';

export type Profile = profiles;
export type Stable = stables;
export type Box = boxes;
export type StableAmenity = stable_amenities;
export type BoxAmenity = box_amenities;
export type Conversation = conversations;
export type Message = messages;
export type StableFaq = stable_faqs;

// Enum types
export type { BoxType, ConversationStatus, EntityType, MessageType };