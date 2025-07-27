-- CreateTable
CREATE TABLE "service_pricing_discounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "days" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pricing_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_pricing_discounts_days_key" ON "service_pricing_discounts"("days");

-- Insert default service pricing discounts
INSERT INTO "service_pricing_discounts" ("days", "percentage", "isActive", "createdAt", "updatedAt") VALUES
(30, 10.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(60, 15.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(90, 20.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);