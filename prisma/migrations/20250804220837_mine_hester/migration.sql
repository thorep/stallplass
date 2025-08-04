-- CreateEnum
CREATE TYPE "HorseGender" AS ENUM ('HOPPE', 'HINGST', 'VALLACH', 'FOLL', 'UNGE_HINGST');

-- CreateTable
CREATE TABLE "horses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "age" INTEGER,
    "color" TEXT,
    "gender" "HorseGender",
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "description" TEXT,
    "careNotes" TEXT,
    "medicalNotes" TEXT,
    "feedingNotes" TEXT,
    "exerciseNotes" TEXT,
    "images" TEXT[],
    "imageDescriptions" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "horses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "horses_publicSlug_key" ON "horses"("publicSlug");

-- AddForeignKey
ALTER TABLE "horses" ADD CONSTRAINT "horses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
