/*
  Warnings:

  - You are about to drop the column `showCareSection` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `showExerciseSection` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `showFeedingSection` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `showMedicalSection` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `showOtherSection` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the `care_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exercise_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feeding_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `other_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."care_logs" DROP CONSTRAINT "care_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."care_logs" DROP CONSTRAINT "care_logs_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."exercise_logs" DROP CONSTRAINT "exercise_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."exercise_logs" DROP CONSTRAINT "exercise_logs_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."feeding_logs" DROP CONSTRAINT "feeding_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."feeding_logs" DROP CONSTRAINT "feeding_logs_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_logs" DROP CONSTRAINT "medical_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_logs" DROP CONSTRAINT "medical_logs_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."other_logs" DROP CONSTRAINT "other_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."other_logs" DROP CONSTRAINT "other_logs_profileId_fkey";

-- AlterTable
ALTER TABLE "public"."horses" DROP COLUMN "showCareSection",
DROP COLUMN "showExerciseSection",
DROP COLUMN "showFeedingSection",
DROP COLUMN "showMedicalSection",
DROP COLUMN "showOtherSection";

-- DropTable
DROP TABLE "public"."care_logs";

-- DropTable
DROP TABLE "public"."exercise_logs";

-- DropTable
DROP TABLE "public"."feeding_logs";

-- DropTable
DROP TABLE "public"."medical_logs";

-- DropTable
DROP TABLE "public"."other_logs";
