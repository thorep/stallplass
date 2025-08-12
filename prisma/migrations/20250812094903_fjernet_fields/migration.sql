/*
  Warnings:

  - You are about to drop the `horse_custom_fields` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."horse_custom_fields" DROP CONSTRAINT "horse_custom_fields_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."horse_custom_fields" DROP CONSTRAINT "horse_custom_fields_horseId_fkey";

-- DropTable
DROP TABLE "public"."horse_custom_fields";
