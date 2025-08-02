import { profiles, stables, boxes, invoice_requests } from '@/generated/prisma';

// Extend Prisma types with admin-specific computed data to match service layer returns
export type AdminProfile = profiles & {
  _count: {
    stables: number;
    invoiceRequests: number;
  };
}

export type AdminStable = stables & {
  owner: profiles; // Service returns full profiles object as stable.profiles -> owner
  advertisingActive: boolean;
  _count: {
    boxes: number;
    conversations: number;
    invoiceRequests: number;
  };
}

export type AdminBox = boxes & {
  stable: stables & {
    owner: {
      firstname: string | null;
      lastname: string | null;
      nickname: string;
    };
  };
  _count: {
    conversations: number;
  };
}

export type AdminInvoiceRequest = invoice_requests & {
  profile: {
    id: string;
    firstname: string | null;
    lastname: string | null;
    nickname: string;
  };
  stable: {
    id: string;
    name: string;
    owner: {
      firstname: string | null;
      lastname: string | null;
      nickname: string;
    };
  } | null;
}