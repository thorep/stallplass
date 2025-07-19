/*
  Warnings:

  - You are about to drop the column `paymentType` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `rentalId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `rentals` table. All the data in the column will be lost.
  - Made the column `stableId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_stableId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paymentType",
DROP COLUMN "rentalId",
ALTER COLUMN "stableId" SET NOT NULL;

-- AlterTable
ALTER TABLE "rentals" DROP COLUMN "paymentStatus";

-- DropEnum
DROP TYPE "PaymentType";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
