/*
  Warnings:

  - You are about to drop the column `careNotes` on the `horses` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseNotes` on the `horses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."horses" DROP COLUMN "careNotes",
DROP COLUMN "exerciseNotes";

-- CreateTable
CREATE TABLE "public"."care_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercise_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "care_logs_horseId_idx" ON "public"."care_logs"("horseId");

-- CreateIndex
CREATE INDEX "exercise_logs_horseId_idx" ON "public"."exercise_logs"("horseId");

-- AddForeignKey
ALTER TABLE "public"."care_logs" ADD CONSTRAINT "care_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_logs" ADD CONSTRAINT "exercise_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
