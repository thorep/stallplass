-- AlterEnum
ALTER TYPE "public"."EntityType" ADD VALUE 'HORSE_BUY';

-- CreateTable
CREATE TABLE "public"."horse_buys" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "gender" "public"."HorseGender",
    "heightMin" INTEGER,
    "heightMax" INTEGER,
    "breedId" TEXT,
    "disciplineId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horse_buys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horse_buys_breedId_idx" ON "public"."horse_buys"("breedId");

-- CreateIndex
CREATE INDEX "horse_buys_disciplineId_idx" ON "public"."horse_buys"("disciplineId");

-- CreateIndex
CREATE INDEX "horse_buys_userId_idx" ON "public"."horse_buys"("userId");

-- AddForeignKey
ALTER TABLE "public"."horse_buys" ADD CONSTRAINT "horse_buys_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "public"."horse_breeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_buys" ADD CONSTRAINT "horse_buys_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."horse_disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horse_buys" ADD CONSTRAINT "horse_buys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
