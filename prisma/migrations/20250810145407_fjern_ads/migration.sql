/*
  Warnings:

  - You are about to drop the column `advertisingActive` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingEndDate` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingStartDate` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingActive` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingEndDate` on the `services` table. All the data in the column will be lost.
  - You are about to drop the `base_prices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `box_quantity_discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `discount_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pricing_discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_pricing_discounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."invoice_requests" DROP CONSTRAINT "invoice_requests_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_requests" DROP CONSTRAINT "invoice_requests_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_requests" DROP CONSTRAINT "invoice_requests_stableId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_requests" DROP CONSTRAINT "invoice_requests_userId_fkey";

-- AlterTable
ALTER TABLE "public"."boxes" DROP COLUMN "advertisingActive",
DROP COLUMN "advertisingEndDate",
DROP COLUMN "advertisingStartDate";

-- AlterTable
ALTER TABLE "public"."services" DROP COLUMN "advertisingActive",
DROP COLUMN "advertisingEndDate";

-- DropTable
DROP TABLE "public"."base_prices";

-- DropTable
DROP TABLE "public"."box_quantity_discounts";

-- DropTable
DROP TABLE "public"."discount_codes";

-- DropTable
DROP TABLE "public"."invoice_requests";

-- DropTable
DROP TABLE "public"."pricing_discounts";

-- DropTable
DROP TABLE "public"."service_pricing_discounts";

-- DropEnum
DROP TYPE "public"."DiscountType";

-- DropEnum
DROP TYPE "public"."InvoiceItemType";

-- DropEnum
DROP TYPE "public"."InvoiceRequestStatus";
