-- AlterTable
ALTER TABLE "public"."horses" ADD COLUMN     "otherNotes" TEXT;

-- CreateTable
CREATE TABLE "public"."other_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "other_logs_horseId_idx" ON "public"."other_logs"("horseId");

-- AddForeignKey
ALTER TABLE "public"."other_logs" ADD CONSTRAINT "other_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
