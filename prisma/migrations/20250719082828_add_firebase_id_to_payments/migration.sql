/*
  Warnings:

  - Added the required column `firebaseId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "boxes" ADD COLUMN     "imageDescriptions" TEXT[],
ADD COLUMN     "isSponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sponsoredStartDate" TIMESTAMP(3),
ADD COLUMN     "sponsoredUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "firebaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "imageDescriptions" TEXT[];
