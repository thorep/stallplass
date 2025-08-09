/*
  Warnings:

  - You are about to drop the `forum_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_moderators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_reactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_thread_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_threads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_user_stats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."forum_moderators" DROP CONSTRAINT "forum_moderators_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_moderators" DROP CONSTRAINT "forum_moderators_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_posts" DROP CONSTRAINT "forum_posts_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_posts" DROP CONSTRAINT "forum_posts_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_posts" DROP CONSTRAINT "forum_posts_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reactions" DROP CONSTRAINT "forum_reactions_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reactions" DROP CONSTRAINT "forum_reactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reports" DROP CONSTRAINT "forum_reports_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reports" DROP CONSTRAINT "forum_reports_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_reports" DROP CONSTRAINT "forum_reports_resolvedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_subscriptions" DROP CONSTRAINT "forum_subscriptions_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_subscriptions" DROP CONSTRAINT "forum_subscriptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_thread_tags" DROP CONSTRAINT "forum_thread_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_thread_tags" DROP CONSTRAINT "forum_thread_tags_threadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_threads" DROP CONSTRAINT "forum_threads_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_threads" DROP CONSTRAINT "forum_threads_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."forum_user_stats" DROP CONSTRAINT "forum_user_stats_userId_fkey";

-- DropTable
DROP TABLE "public"."forum_categories";

-- DropTable
DROP TABLE "public"."forum_moderators";

-- DropTable
DROP TABLE "public"."forum_posts";

-- DropTable
DROP TABLE "public"."forum_reactions";

-- DropTable
DROP TABLE "public"."forum_reports";

-- DropTable
DROP TABLE "public"."forum_subscriptions";

-- DropTable
DROP TABLE "public"."forum_tags";

-- DropTable
DROP TABLE "public"."forum_thread_tags";

-- DropTable
DROP TABLE "public"."forum_threads";

-- DropTable
DROP TABLE "public"."forum_user_stats";

-- DropEnum
DROP TYPE "public"."ReactionType";

-- DropEnum
DROP TYPE "public"."ReportReason";

-- DropEnum
DROP TYPE "public"."ReportStatus";
