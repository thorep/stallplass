-- CreateEnum
CREATE TYPE "BoxType" AS ENUM ('BOKS', 'UTEGANG');

-- AlterTable
ALTER TABLE "boxes" ADD COLUMN     "boxType" "BoxType" NOT NULL DEFAULT 'BOKS';

-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "totalBoxes" INTEGER;
