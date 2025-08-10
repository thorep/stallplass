-- AlterTable
ALTER TABLE "public"."forum_posts" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "forum_reactions_postId_idx" ON "public"."forum_reactions"("postId");
