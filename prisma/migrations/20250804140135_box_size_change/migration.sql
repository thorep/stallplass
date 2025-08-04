/*
  Warnings:

  - The `size` column on the `boxes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BoxSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "boxes" DROP COLUMN "size",
ADD COLUMN     "size" "BoxSize";
