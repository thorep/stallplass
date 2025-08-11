-- AlterTable
ALTER TABLE "public"."horses" ADD COLUMN     "showCareSection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showExerciseSection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFeedingSection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showMedicalSection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOtherSection" BOOLEAN NOT NULL DEFAULT true;
