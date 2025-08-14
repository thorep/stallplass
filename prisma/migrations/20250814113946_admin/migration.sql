/*
  Warnings:

  - A unique constraint covering the columns `[userId,serviceId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."conversations" ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "serviceSnapshot" JSONB;

-- CreateTable
CREATE TABLE "public"."admin_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "advertisementChance" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "advertisementMinPos" INTEGER NOT NULL DEFAULT 1,
    "advertisementMaxPos" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_serviceId_idx" ON "public"."conversations"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userId_serviceId_key" ON "public"."conversations"("userId", "serviceId");

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
