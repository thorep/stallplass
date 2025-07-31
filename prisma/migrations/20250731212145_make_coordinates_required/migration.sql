/*
  Warnings:

  - Made the column `latitude` on table `stables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `stables` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stables" ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;
