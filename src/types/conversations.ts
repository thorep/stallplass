import { Database } from './supabase';

// Base Supabase types
export type Conversation = Database['public']['Tables']['samtaler']['Row'];
export type Message = Database['public']['Tables']['meldinger']['Row'];
export type Rental = Database['public']['Tables']['utleie']['Row'];

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
    eier_navn: string;
    owner_email: string;
    eier_id: string;
  };
  box?: {
    id: string;
    name: string;
    grunnpris: number;
    er_tilgjengelig: boolean | null;
  };
  messages: Array<{
    id: string;
    content: string;
    message_type: Database['public']['Enums']['message_type'] | null;
    opprettet_dato: string | null;
    is_read: boolean | null;
  }>;
  rental?: {
    id: string;
    status: Database['public']['Enums']['rental_status'] | null;
    start_date: string;
    end_date: string | null;
  };
  _count?: {
    messages: number;
  };
};