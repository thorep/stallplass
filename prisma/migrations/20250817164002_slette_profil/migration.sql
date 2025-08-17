-- DropForeignKey
ALTER TABLE "public"."forum_posts" DROP CONSTRAINT "forum_posts_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reactions" DROP CONSTRAINT "forum_reactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_senderId_fkey";

-- AlterTable
ALTER TABLE "public"."forum_posts" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."forum_reactions" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."messages" ALTER COLUMN "senderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reactions" ADD CONSTRAINT "forum_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
