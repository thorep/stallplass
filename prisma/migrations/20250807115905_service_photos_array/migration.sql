/*
  Warnings:

  - You are about to drop the `service_photos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."service_photos" DROP CONSTRAINT "service_photos_serviceId_fkey";

-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "imageDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "public"."service_photos";
