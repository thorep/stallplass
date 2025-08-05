/*
  Warnings:

  - You are about to drop the column `isPublic` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `publicSlug` on the `horses` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."horses_publicSlug_key";

-- AlterTable
ALTER TABLE "public"."horses" DROP COLUMN "isPublic",
DROP COLUMN "publicSlug";
