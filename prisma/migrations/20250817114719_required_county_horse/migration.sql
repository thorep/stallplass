/*
  Warnings:

  - Made the column `countyId` on table `horse_sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `municipalityId` on table `horse_sales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."horse_sales" DROP CONSTRAINT "horse_sales_countyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."horse_sales" DROP CONSTRAINT "horse_sales_municipalityId_fkey";

-- AlterTable
ALTER TABLE "public"."horse_sales" ALTER COLUMN "countyId" SET NOT NULL,
ALTER COLUMN "municipalityId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "public"."counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_sales" ADD CONSTRAINT "horse_sales_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
