/*
  Warnings:

  - You are about to drop the column `availabilityDate` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `boxes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."boxes" DROP COLUMN "availabilityDate",
DROP COLUMN "isAvailable",
ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 1;
