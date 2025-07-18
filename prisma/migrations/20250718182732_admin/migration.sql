-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoadmapPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "roadmap_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "RoadmapPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_items_pkey" PRIMARY KEY ("id")
);
