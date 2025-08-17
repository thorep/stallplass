-- DropForeignKey
ALTER TABLE "public"."conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- AlterTable
ALTER TABLE "public"."conversations" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
