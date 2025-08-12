-- CreateTable
CREATE TABLE "public"."custom_log_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'ClipboardList',
    "color" TEXT NOT NULL DEFAULT 'text-indigo-600',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_log_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_log_categories_horseId_idx" ON "public"."custom_log_categories"("horseId");

-- CreateIndex
CREATE INDEX "custom_log_categories_ownerId_idx" ON "public"."custom_log_categories"("ownerId");

-- CreateIndex
CREATE INDEX "custom_log_categories_horseId_isActive_sortOrder_idx" ON "public"."custom_log_categories"("horseId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "custom_log_categories_horseId_name_key" ON "public"."custom_log_categories"("horseId", "name");

-- CreateIndex
CREATE INDEX "custom_logs_categoryId_idx" ON "public"."custom_logs"("categoryId");

-- CreateIndex
CREATE INDEX "custom_logs_horseId_idx" ON "public"."custom_logs"("horseId");

-- CreateIndex
CREATE INDEX "custom_logs_profileId_idx" ON "public"."custom_logs"("profileId");

-- CreateIndex
CREATE INDEX "custom_logs_categoryId_createdAt_idx" ON "public"."custom_logs"("categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."custom_log_categories" ADD CONSTRAINT "custom_log_categories_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_log_categories" ADD CONSTRAINT "custom_log_categories_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_logs" ADD CONSTRAINT "custom_logs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."custom_log_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_logs" ADD CONSTRAINT "custom_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_logs" ADD CONSTRAINT "custom_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
