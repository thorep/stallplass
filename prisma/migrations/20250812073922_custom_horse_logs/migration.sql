-- CreateTable
CREATE TABLE "public"."horse_field_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_field_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horse_custom_fields" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horse_custom_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_custom_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horse_field_categories_horseId_idx" ON "public"."horse_field_categories"("horseId");

-- CreateIndex
CREATE UNIQUE INDEX "horse_field_categories_horseId_name_key" ON "public"."horse_field_categories"("horseId", "name");

-- CreateIndex
CREATE INDEX "horse_custom_fields_categoryId_idx" ON "public"."horse_custom_fields"("categoryId");

-- CreateIndex
CREATE INDEX "horse_custom_fields_horseId_idx" ON "public"."horse_custom_fields"("horseId");

-- CreateIndex
CREATE UNIQUE INDEX "horse_custom_fields_categoryId_fieldName_key" ON "public"."horse_custom_fields"("categoryId", "fieldName");

-- CreateIndex
CREATE INDEX "horse_custom_logs_categoryId_idx" ON "public"."horse_custom_logs"("categoryId");

-- CreateIndex
CREATE INDEX "horse_custom_logs_horseId_idx" ON "public"."horse_custom_logs"("horseId");

-- CreateIndex
CREATE INDEX "horse_custom_logs_profileId_idx" ON "public"."horse_custom_logs"("profileId");

-- CreateIndex
CREATE INDEX "horse_custom_logs_createdAt_idx" ON "public"."horse_custom_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."horse_field_categories" ADD CONSTRAINT "horse_field_categories_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_custom_fields" ADD CONSTRAINT "horse_custom_fields_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."horse_field_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_custom_fields" ADD CONSTRAINT "horse_custom_fields_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_custom_logs" ADD CONSTRAINT "horse_custom_logs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."horse_field_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_custom_logs" ADD CONSTRAINT "horse_custom_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_custom_logs" ADD CONSTRAINT "horse_custom_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
