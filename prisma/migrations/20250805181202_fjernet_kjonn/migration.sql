/*
  Warnings:

  - The values [FOLL,UNGE_HINGST] on the enum `HorseGender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."HorseGender_new" AS ENUM ('HOPPE', 'HINGST', 'VALLACH');
ALTER TABLE "public"."horses" ALTER COLUMN "gender" TYPE "public"."HorseGender_new" USING ("gender"::text::"public"."HorseGender_new");
ALTER TYPE "public"."HorseGender" RENAME TO "HorseGender_old";
ALTER TYPE "public"."HorseGender_new" RENAME TO "HorseGender";
DROP TYPE "public"."HorseGender_old";
COMMIT;
