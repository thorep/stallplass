-- CreateTable
CREATE TABLE "boost_pricing_discounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "days" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_pricing_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boost_pricing_discounts_days_key" ON "boost_pricing_discounts"("days");