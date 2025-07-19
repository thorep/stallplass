-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VIPPS', 'CARD');

-- AlterTable
ALTER TABLE "rentals" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "rentalId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "months" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "vippsOrderId" TEXT NOT NULL,
    "vippsReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'VIPPS',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_vippsOrderId_key" ON "payments"("vippsOrderId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("firebaseId") ON DELETE CASCADE ON UPDATE CASCADE;
