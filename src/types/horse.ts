import { HorseGender } from "@/generated/prisma";

export interface CreateHorseData {
  name: string;
  breed?: string;
  age?: number;
  color?: string;
  gender?: HorseGender;
  height?: number;
  weight?: number;
  description?: string;
  careNotes?: string;
  medicalNotes?: string;
  feedingNotes?: string;
  exerciseNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  isPublic?: boolean;
}

export type UpdateHorseData = Partial<CreateHorseData>;

export interface HorseWithOwner {
  id: string;
  name: string;
  breed?: string | null;
  age?: number | null;
  color?: string | null;
  gender?: HorseGender | null;
  height?: number | null;
  weight?: number | null;
  description?: string | null;
  careNotes?: string | null;
  medicalNotes?: string | null;
  feedingNotes?: string | null;
  exerciseNotes?: string | null;
  images: string[];
  imageDescriptions: string[];
  isPublic: boolean;
  publicSlug?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  deletedAt?: Date | null;
  profiles: {
    nickname: string;
  };
}

export interface HorseFormData {
  name: string;
  breed: string;
  age: string;
  color: string;
  gender: HorseGender | '';
  height: string;
  weight: string;
  description: string;
  careNotes: string;
  medicalNotes: string;
  feedingNotes: string;
  exerciseNotes: string;
  isPublic: boolean;
}

export const HORSE_GENDER_LABELS: Record<HorseGender, string> = {
  HOPPE: 'Hoppe',
  HINGST: 'Hingst',
  VALLACH: 'Vallach',
  FOLL: 'Føll',
  UNGE_HINGST: 'Ung hingst',
};