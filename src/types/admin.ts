import { Tables } from '@/types/supabase';

// Extend Supabase types with admin-specific computed data
export type AdminUser = Tables<'users'> & {
  _count: {
    stables: number;
    rentals: number;
  };
}

export type AdminStable = Tables<'stables'> & {
  rating: number;
  reviewCount: number;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
  _count: {
    boxes: number;
    conversations: number;
    rentals: number;
  };
}

export type AdminBox = Tables<'boxes'> & {
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
  _count: {
    conversations: number;
    rentals: number;
  };
}

export type AdminPayment = Tables<'payments'> & {
  user: {
    id: string;
    firebase_id: string;
    email: string;
    name: string | null;
  };
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
}