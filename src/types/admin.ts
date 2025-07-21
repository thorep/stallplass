import { Tables } from '@/types/supabase';

// Extend Supabase types with admin-specific computed data
export type AdminUser = Tables<'brukere'> & {
  _count: {
    stables: number;
    rentals: number;
  };
}

export type AdminStable = Tables<'staller'> & {
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

export type AdminBox = Tables<'stallplasser'> & {
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

export type AdminPayment = Tables<'betalinger'> & {
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