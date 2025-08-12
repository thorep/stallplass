/*
  Warnings:

  - You are about to drop the `horse_custom_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horse_field_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."horse_custom_logs" DROP CONSTRAINT "horse_custom_logs_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."horse_custom_logs" DROP CONSTRAINT "horse_custom_logs_horseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."horse_custom_logs" DROP CONSTRAINT "horse_custom_logs_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."horse_field_categories" DROP CONSTRAINT "horse_field_categories_horseId_fkey";

-- DropTable
DROP TABLE "public"."horse_custom_logs";

-- DropTable
DROP TABLE "public"."horse_field_categories";
