/*
  Warnings:

  - Added the required column `profileId` to the `care_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `exercise_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `feeding_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `medical_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `other_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."care_logs" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."exercise_logs" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."feeding_logs" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."medical_logs" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."other_logs" ADD COLUMN     "profileId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."horse_shares" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "horseId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY['VIEW']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horse_shares_horseId_idx" ON "public"."horse_shares"("horseId");

-- CreateIndex
CREATE INDEX "horse_shares_sharedWithId_idx" ON "public"."horse_shares"("sharedWithId");

-- CreateIndex
CREATE INDEX "horse_shares_sharedById_idx" ON "public"."horse_shares"("sharedById");

-- CreateIndex
CREATE UNIQUE INDEX "horse_shares_horseId_sharedWithId_key" ON "public"."horse_shares"("horseId", "sharedWithId");

-- CreateIndex
CREATE INDEX "care_logs_profileId_idx" ON "public"."care_logs"("profileId");

-- CreateIndex
CREATE INDEX "exercise_logs_profileId_idx" ON "public"."exercise_logs"("profileId");

-- CreateIndex
CREATE INDEX "feeding_logs_profileId_idx" ON "public"."feeding_logs"("profileId");

-- CreateIndex
CREATE INDEX "medical_logs_profileId_idx" ON "public"."medical_logs"("profileId");

-- CreateIndex
CREATE INDEX "other_logs_profileId_idx" ON "public"."other_logs"("profileId");

-- AddForeignKey
ALTER TABLE "public"."care_logs" ADD CONSTRAINT "care_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_logs" ADD CONSTRAINT "exercise_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feeding_logs" ADD CONSTRAINT "feeding_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_logs" ADD CONSTRAINT "medical_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."other_logs" ADD CONSTRAINT "other_logs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_shares" ADD CONSTRAINT "horse_shares_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "public"."horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_shares" ADD CONSTRAINT "horse_shares_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_shares" ADD CONSTRAINT "horse_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
