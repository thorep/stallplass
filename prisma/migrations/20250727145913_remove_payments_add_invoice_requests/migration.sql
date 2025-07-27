-- Remove old payments table and related enums (if they exist)
DROP TABLE IF EXISTS "payments";
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "PaymentMethod";

-- CreateEnum
CREATE TYPE "InvoiceRequestStatus" AS ENUM ('PENDING', 'INVOICE_SENT', 'PAID', 'CANCELLED');

-- CreateEnum  
CREATE TYPE "InvoiceItemType" AS ENUM ('STABLE_ADVERTISING', 'BOX_ADVERTISING', 'BOX_SPONSORED', 'SERVICE_ADVERTISING');

-- CreateTable
CREATE TABLE "invoice_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "months" INTEGER,
    "days" INTEGER,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" "InvoiceItemType" NOT NULL,
    "status" "InvoiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceSent" BOOLEAN NOT NULL DEFAULT false,
    "invoiceSentAt" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "stableId" TEXT,
    "serviceId" TEXT,
    "boxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;