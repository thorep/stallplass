/*
  Warnings:

  - A unique constraint covering the columns `[userId,horseSaleId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."HorseSize" AS ENUM ('A_PONNY', 'B_PONNY', 'C_PONNY', 'D_PONNY', 'UNDER_160', 'SIZE_160_170', 'OVER_170');

-- AlterTable
ALTER TABLE "public"."conversations" ADD COLUMN     "horseSaleId" TEXT,
ADD COLUMN     "horseSaleSnapshot" JSONB;

-- CreateTable
CREATE TABLE "public"."horse_breeds" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horse_disciplines" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horse_sales" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "public"."HorseGender" NOT NULL,
    "breedId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "size" "public"."HorseSize" NOT NULL,
    "height" INTEGER,
    "address" TEXT,
    "postalCode" TEXT,
    "postalPlace" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "countyId" TEXT,
    "municipalityId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "horse_breeds_name_key" ON "public"."horse_breeds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "horse_disciplines_name_key" ON "public"."horse_disciplines"("name");

-- CreateIndex
CREATE INDEX "conversations_horseSaleId_idx" ON "public"."conversations"("horseSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userId_horseSaleId_key" ON "public"."conversations"("userId", "horseSaleId");

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_horseSaleId_fkey" FOREIGN KEY ("horseSaleId") REFERENCES "public"."horse_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "public"."horse_breeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."horse_disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "public"."counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
