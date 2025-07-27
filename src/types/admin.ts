import { users, stables, boxes, invoice_requests } from '@/generated/prisma';

// Extend Prisma types with admin-specific computed data to match service layer returns
export type AdminUser = users & {
  _count: {
    stables: number;
    invoiceRequests: number;
  };
}

export type AdminStable = stables & {
  owner: users; // Service returns full users object as stable.users -> owner
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
      email: string;
      name: string | null;
    };
  };
  _count: {
    conversations: number;
  };
}

export type AdminInvoiceRequest = invoice_requests & {
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
  } | null;
}