import { Tables, Enums } from './supabase';

// Base Supabase types
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type Rental = Tables<'rentals'>;

// Message with sender information
export type MessageWithSender = Message & {
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
};

// Extended types for API responses with relations
export type ConversationWithRelations = Conversation & {
  rider: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  stable: {
    id: string;
    name: string;
    owner_id: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  box?: {
    id: string;
    name: string;
    price: number;
    is_available: boolean | null;
  };
  messages: Array<{
    id: string;
    content: string;
    message_type: Enums<'message_type'> | null;
    created_at: string | null;
    is_read: boolean | null;
  }>;
  rental?: {
    id: string;
    status: Enums<'rental_status'> | null;
    start_date: string;
    end_date: string | null;
  };
  _count?: {
    messages: number;
  };
};