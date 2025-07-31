/*
  Warnings:

  - You are about to drop the column `days` on the `service_pricing_discounts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[months]` on the table `service_pricing_discounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `months` to the `service_pricing_discounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "service_pricing_discounts_days_key";

-- AlterTable
ALTER TABLE "service_pricing_discounts" DROP COLUMN "days",
ADD COLUMN     "months" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_pricing_discounts_months_key" ON "service_pricing_discounts"("months");
