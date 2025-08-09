-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'HELPFUL', 'THANKS', 'AGREE', 'DISAGREE');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'OFF_TOPIC', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN     "favoriteStables" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."forum_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_threads" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_posts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_reactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_subscriptions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_thread_tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "threadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "forum_thread_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_moderators" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_moderators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_reports" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "public"."ReportReason" NOT NULL,
    "description" TEXT,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_user_stats" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "threadCount" INTEGER NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "public"."forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_threads_categoryId_idx" ON "public"."forum_threads"("categoryId");

-- CreateIndex
CREATE INDEX "forum_threads_authorId_idx" ON "public"."forum_threads"("authorId");

-- CreateIndex
CREATE INDEX "forum_threads_lastActivityAt_idx" ON "public"."forum_threads"("lastActivityAt");

-- CreateIndex
CREATE INDEX "forum_posts_threadId_idx" ON "public"."forum_posts"("threadId");

-- CreateIndex
CREATE INDEX "forum_posts_authorId_idx" ON "public"."forum_posts"("authorId");

-- CreateIndex
CREATE INDEX "forum_reactions_postId_idx" ON "public"."forum_reactions"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_reactions_postId_userId_type_key" ON "public"."forum_reactions"("postId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "forum_subscriptions_threadId_userId_key" ON "public"."forum_subscriptions"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_tags_name_key" ON "public"."forum_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forum_tags_slug_key" ON "public"."forum_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "forum_thread_tags_threadId_tagId_key" ON "public"."forum_thread_tags"("threadId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_moderators_userId_categoryId_key" ON "public"."forum_moderators"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "forum_reports_status_idx" ON "public"."forum_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "forum_user_stats_userId_key" ON "public"."forum_user_stats"("userId");

-- AddForeignKey
ALTER TABLE "public"."forum_threads" ADD CONSTRAINT "forum_threads_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_threads" ADD CONSTRAINT "forum_threads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."forum_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reactions" ADD CONSTRAINT "forum_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reactions" ADD CONSTRAINT "forum_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_subscriptions" ADD CONSTRAINT "forum_subscriptions_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_subscriptions" ADD CONSTRAINT "forum_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_thread_tags" ADD CONSTRAINT "forum_thread_tags_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_thread_tags" ADD CONSTRAINT "forum_thread_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."forum_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_moderators" ADD CONSTRAINT "forum_moderators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_moderators" ADD CONSTRAINT "forum_moderators_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reports" ADD CONSTRAINT "forum_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reports" ADD CONSTRAINT "forum_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reports" ADD CONSTRAINT "forum_reports_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_user_stats" ADD CONSTRAINT "forum_user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
