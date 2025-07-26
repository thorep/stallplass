/*
  Warnings:

  - You are about to drop the column `hasElectricity` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `hasWater` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `hasWindow` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `isIndoor` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingActive` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingEndDate` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingStartDate` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `featured` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `ownerEmail` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `ownerPhone` on the `stables` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "boxes" DROP COLUMN "hasElectricity",
DROP COLUMN "hasWater",
DROP COLUMN "hasWindow",
DROP COLUMN "isActive",
DROP COLUMN "isIndoor",
ADD COLUMN     "advertisingStartDate" TIMESTAMP(3),
ADD COLUMN     "advertisingUntil" TIMESTAMP(3),
ADD COLUMN     "isAdvertised" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stables" DROP COLUMN "advertisingActive",
DROP COLUMN "advertisingEndDate",
DROP COLUMN "advertisingStartDate",
DROP COLUMN "featured",
DROP COLUMN "ownerEmail",
DROP COLUMN "ownerName",
DROP COLUMN "ownerPhone";
