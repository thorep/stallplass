/*
  Warnings:

  - The values [STABLE_ADVERTISING,STABLE_SLOT_ADVERTISING] on the enum `InvoiceItemType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `hasAdvertisingSlot` on the `boxes` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingEndDate` on the `stables` table. All the data in the column will be lost.
  - You are about to drop the column `advertisingSlots` on the `stables` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceItemType_new" AS ENUM ('BOX_ADVERTISING', 'BOX_SPONSORED', 'SERVICE_ADVERTISING');
ALTER TABLE "invoice_requests" ALTER COLUMN "itemType" TYPE "InvoiceItemType_new" USING ("itemType"::text::"InvoiceItemType_new");
ALTER TYPE "InvoiceItemType" RENAME TO "InvoiceItemType_old";
ALTER TYPE "InvoiceItemType_new" RENAME TO "InvoiceItemType";
DROP TYPE "InvoiceItemType_old";
COMMIT;

-- AlterTable
ALTER TABLE "boxes" DROP COLUMN "hasAdvertisingSlot",
ADD COLUMN     "advertisingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "advertisingEndDate" TIMESTAMP(3),
ADD COLUMN     "advertisingStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stables" DROP COLUMN "advertisingEndDate",
DROP COLUMN "advertisingSlots";
