/*
  Warnings:

  - A unique constraint covering the columns `[userId,partLoanHorseId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."conversations" ADD COLUMN     "partLoanHorseId" TEXT,
ADD COLUMN     "partLoanHorseSnapshot" JSONB;

-- CreateTable
CREATE TABLE "public"."part_loan_horses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "postalPlace" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "countyId" TEXT,
    "municipalityId" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_loan_horses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_partLoanHorseId_idx" ON "public"."conversations"("partLoanHorseId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userId_partLoanHorseId_key" ON "public"."conversations"("userId", "partLoanHorseId");

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_partLoanHorseId_fkey" FOREIGN KEY ("partLoanHorseId") REFERENCES "public"."part_loan_horses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."part_loan_horses" ADD CONSTRAINT "part_loan_horses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."part_loan_horses" ADD CONSTRAINT "part_loan_horses_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "public"."counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."part_loan_horses" ADD CONSTRAINT "part_loan_horses_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
