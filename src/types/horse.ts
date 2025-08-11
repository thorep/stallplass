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
  careInstructions?: string;
  exerciseInstructions?: string;
  medicalNotes?: string;
  feedingNotes?: string;
  otherNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  logDisplayMode?: "FULL" | "TRUNCATED";
  showCareSection?: boolean;
  showExerciseSection?: boolean;
  showFeedingSection?: boolean;
  showMedicalSection?: boolean;
  showOtherSection?: boolean;
  stableId?: string;
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
  careInstructions?: string | null;
  exerciseInstructions?: string | null;
  medicalNotes?: string | null;
  feedingNotes?: string | null;
  otherNotes?: string | null;
  images: string[];
  imageDescriptions: string[];
  logDisplayMode: string;
  showCareSection?: boolean;
  showExerciseSection?: boolean;
  showFeedingSection?: boolean;
  showMedicalSection?: boolean;
  showOtherSection?: boolean;
  stableId?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  deletedAt?: Date | null;
  profiles: {
    nickname: string;
  };
  // Stable information
  stable?: {
    id: string;
    name: string;
    address?: string | null;
    postalCode?: string | null;
    postalPlace?: string | null;
    latitude: number;
    longitude: number;
  } | null;
  // Sharing information
  isOwner?: boolean;
  permissions?: string[];
  sharedBy?: {
    id: string;
    nickname: string;
  } | null;
}

export interface HorseFormData {
  name: string;
  breed: string;
  age: string;
  color: string;
  gender: HorseGender | "";
  height: string;
  weight: string;
  images: string[];
  imageDescriptions: string[];
}

export const HORSE_GENDER_LABELS: Record<HorseGender, string> = {
  HOPPE: "Hoppe",
  HINGST: "Hingst",
  VALLACH: "Vallak",
};
