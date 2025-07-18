/*
  Warnings:

  - You are about to drop the column `amenityId` on the `box_amenities` table. All the data in the column will be lost.
  - You are about to drop the column `boxId` on the `box_amenities` table. All the data in the column will be lost.
  - You are about to drop the column `amenityId` on the `stable_amenities` table. All the data in the column will be lost.
  - You are about to drop the column `stableId` on the `stable_amenities` table. All the data in the column will be lost.
  - You are about to drop the `amenities` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `box_amenities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `stable_amenities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `box_amenities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `stable_amenities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "box_amenities" DROP CONSTRAINT "box_amenities_amenityId_fkey";

-- DropForeignKey
ALTER TABLE "box_amenities" DROP CONSTRAINT "box_amenities_boxId_fkey";

-- DropForeignKey
ALTER TABLE "stable_amenities" DROP CONSTRAINT "stable_amenities_amenityId_fkey";

-- DropForeignKey
ALTER TABLE "stable_amenities" DROP CONSTRAINT "stable_amenities_stableId_fkey";

-- DropIndex
DROP INDEX "box_amenities_boxId_amenityId_key";

-- DropIndex
DROP INDEX "stable_amenities_stableId_amenityId_key";

-- AlterTable
ALTER TABLE "box_amenities" DROP COLUMN "amenityId",
DROP COLUMN "boxId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "boxes" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stable_amenities" DROP COLUMN "amenityId",
DROP COLUMN "stableId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "amenities";

-- CreateTable
CREATE TABLE "stable_amenity_links" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "stableId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stable_amenity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_amenity_links" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "boxId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "box_amenity_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stable_amenity_links_stableId_amenityId_key" ON "stable_amenity_links"("stableId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "box_amenity_links_boxId_amenityId_key" ON "box_amenity_links"("boxId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "box_amenities_name_key" ON "box_amenities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stable_amenities_name_key" ON "stable_amenities"("name");

-- AddForeignKey
ALTER TABLE "stable_amenity_links" ADD CONSTRAINT "stable_amenity_links_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stable_amenity_links" ADD CONSTRAINT "stable_amenity_links_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "stable_amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_amenity_links" ADD CONSTRAINT "box_amenity_links_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_amenity_links" ADD CONSTRAINT "box_amenity_links_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "box_amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
