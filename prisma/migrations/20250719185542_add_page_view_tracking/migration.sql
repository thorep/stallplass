/*
  Warnings:

  - You are about to drop the column `hasDoor` on the `boxes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('STABLE', 'BOX');

-- AlterTable
ALTER TABLE "boxes" DROP COLUMN "hasDoor";

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "viewerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_entityType_entityId_idx" ON "page_views"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_stable_fkey" FOREIGN KEY ("entityId") REFERENCES "stables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_box_fkey" FOREIGN KEY ("entityId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("firebaseId") ON DELETE SET NULL ON UPDATE CASCADE;
