-- CreateTable
CREATE TABLE "box_quantity_discounts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "minBoxes" INTEGER NOT NULL,
    "maxBoxes" INTEGER,
    "discountPercentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "box_quantity_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "box_quantity_discounts_minBoxes_maxBoxes_key" ON "box_quantity_discounts"("minBoxes", "maxBoxes");
