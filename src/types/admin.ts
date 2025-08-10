import { profiles, stables, boxes } from '@/generated/prisma';

// Extend Prisma types with admin-specific computed data to match service layer returns
export type AdminProfile = profiles & {
  _count: {
    stables: number;
  };
}

export type AdminStable = stables & {
  owner: profiles; // Service returns full profiles object as stable.profiles -> owner
  _count: {
    boxes: number;
    conversations: number;
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