/*
  Warnings:

  - A unique constraint covering the columns `[days,maxDays]` on the table `boost_pricing_discounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "boost_pricing_discounts_days_key";

-- AlterTable
ALTER TABLE "boost_pricing_discounts" ADD COLUMN     "maxDays" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "boost_pricing_discounts_days_maxDays_key" ON "boost_pricing_discounts"("days", "maxDays");
