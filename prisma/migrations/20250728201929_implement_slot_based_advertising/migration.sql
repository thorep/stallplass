-- AlterEnum
ALTER TYPE "InvoiceItemType" ADD VALUE 'STABLE_SLOT_ADVERTISING';

-- AlterTable
ALTER TABLE "boxes" ADD COLUMN     "hasAdvertisingSlot" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "invoice_requests" ADD COLUMN     "slots" INTEGER;

-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "advertisingEndDate" TIMESTAMP(3),
ADD COLUMN     "advertisingSlots" INTEGER NOT NULL DEFAULT 0;
