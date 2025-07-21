import { Database } from './supabase';

// Base Supabase types
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Rental = Database['public']['Tables']['rentals']['Row'];

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
    owner_id: string;
  };
  box?: {
    id: string;
    name: string;
    maanedlig_pris: number;
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