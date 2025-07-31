/*
  Warnings:

  - You are about to drop the `page_views` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_box_fkey";

-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_stable_fkey";

-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_viewerId_fkey";

-- AlterTable
ALTER TABLE "boxes" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stables" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "page_views";
