/*
  Warnings:

  - The values [SYSTEM] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "ConversationStatus" ADD VALUE 'BLOCKED';

-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'IMAGE', 'STABLE_LINK', 'BOX_LINK');
ALTER TABLE "messages" ALTER COLUMN "messageType" DROP DEFAULT;
ALTER TABLE "messages" ALTER COLUMN "messageType" TYPE "MessageType_new" USING ("messageType"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "MessageType_old";
ALTER TABLE "messages" ALTER COLUMN "messageType" SET DEFAULT 'TEXT';
COMMIT;

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_stableId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "boxSnapshot" JSONB,
ADD COLUMN     "stableSnapshot" JSONB,
ALTER COLUMN "stableId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "conversations_stableId_idx" ON "conversations"("stableId");

-- CreateIndex
CREATE INDEX "conversations_boxId_idx" ON "conversations"("boxId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
