-- CreateTable
CREATE TABLE "public"."budget_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "intervalMonths" INTEGER,
    "anchorDay" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budget_overrides" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "budgetItemId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "overrideAmount" INTEGER,
    "skip" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_items_horseId_startMonth_idx" ON "public"."budget_items"("horseId", "startMonth");

-- CreateIndex
CREATE INDEX "budget_items_horseId_isRecurring_idx" ON "public"."budget_items"("horseId", "isRecurring");

-- CreateIndex
CREATE INDEX "budget_overrides_month_idx" ON "public"."budget_overrides"("month");

-- CreateIndex
CREATE UNIQUE INDEX "budget_overrides_budgetItemId_month_key" ON "public"."budget_overrides"("budgetItemId", "month");

-- AddForeignKey
ALTER TABLE "public"."budget_items" ADD CONSTRAINT "budget_items_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_overrides" ADD CONSTRAINT "budget_overrides_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "public"."budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
