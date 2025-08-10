-- AlterTable
ALTER TABLE "public"."forum_categories" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "public"."forum_sections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_sections_name_key" ON "public"."forum_sections"("name");

-- CreateIndex
CREATE INDEX "forum_sections_sortOrder_isActive_idx" ON "public"."forum_sections"("sortOrder", "isActive");

-- CreateIndex
CREATE INDEX "forum_categories_sectionId_idx" ON "public"."forum_categories"("sectionId");

-- AddForeignKey
ALTER TABLE "public"."forum_categories" ADD CONSTRAINT "forum_categories_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."forum_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
