-- CreateTable
CREATE TABLE "public"."feeding_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeding_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feeding_logs_horseId_idx" ON "public"."feeding_logs"("horseId");

-- CreateIndex
CREATE INDEX "medical_logs_horseId_idx" ON "public"."medical_logs"("horseId");

-- AddForeignKey
ALTER TABLE "public"."feeding_logs" ADD CONSTRAINT "feeding_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_logs" ADD CONSTRAINT "medical_logs_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
