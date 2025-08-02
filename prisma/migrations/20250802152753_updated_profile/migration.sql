/*
  Warnings:

  - You are about to drop the column `avatar` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `profiles` table. All the data in the column will be lost.

*/
-- RenameConstraint  
ALTER TABLE "profiles" RENAME CONSTRAINT "users_pkey" TO "profiles_pkey";

-- AlterTable
ALTER TABLE "profiles" 
DROP COLUMN "avatar",
DROP COLUMN "name",
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "lastname" TEXT,
ADD COLUMN     "middlename" TEXT,
ADD COLUMN     "nickname" TEXT NOT NULL DEFAULT 'test_nickname';

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "profiles_email_key";