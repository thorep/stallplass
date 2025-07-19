-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RENTAL', 'ADVERTISING');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'RENTAL',
ADD COLUMN     "stableId" TEXT;

-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "advertisingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "advertisingEndDate" TIMESTAMP(3),
ADD COLUMN     "advertisingStartDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
