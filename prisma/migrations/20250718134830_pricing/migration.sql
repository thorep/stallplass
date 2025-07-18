/*
  Warnings:

  - You are about to drop the `pricing_tiers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "pricing_tiers";

-- CreateTable
CREATE TABLE "base_prices" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_discounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "months" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "base_prices_name_key" ON "base_prices"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_discounts_months_key" ON "pricing_discounts"("months");
