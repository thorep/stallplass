/*
  Warnings:

  - Added the required column `test` to the `stables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "test" INTEGER NOT NULL;
