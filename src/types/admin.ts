import { users, stables, boxes, payments } from '@/generated/prisma';

// Extend Prisma types with admin-specific computed data
export type AdminUser = users & {
  isAdmin: boolean;
  _count: {
    stables: number;
    rentals: number;
  };
}

export type AdminStable = stables & {
  advertisingActive?: boolean;
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

export type AdminBox = boxes & {
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

export type AdminPayment = payments & {
  user: {
    id: string;
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