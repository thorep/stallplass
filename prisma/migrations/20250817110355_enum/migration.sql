/*
  Warnings:

  - The values [A_PONNY,B_PONNY,C_PONNY,D_PONNY] on the enum `HorseSize` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."EntityType" ADD VALUE 'HORSE_SALE';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."HorseSize_new" AS ENUM ('KATEGORI_4', 'KATEGORI_3', 'KATEGORI_2', 'KATEGORI_1', 'UNDER_160', 'SIZE_160_170', 'OVER_170');
ALTER TABLE "public"."horse_sales" ALTER COLUMN "size" TYPE "public"."HorseSize_new" USING ("size"::text::"public"."HorseSize_new");
ALTER TYPE "public"."HorseSize" RENAME TO "HorseSize_old";
ALTER TYPE "public"."HorseSize_new" RENAME TO "HorseSize";
DROP TYPE "public"."HorseSize_old";
COMMIT;
