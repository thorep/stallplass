/*
  Warnings:

  - You are about to drop the column `advertisingStartDate` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingUntil` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `isAdvertised` on the `boxes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "boxes" DROP COLUMN "advertisingStartDate",
DROP COLUMN "advertisingUntil",
DROP COLUMN "isAdvertised";
