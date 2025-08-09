-- Production Fix Migration
-- This migration resolves the failed migration P3009 by:
-- 1. Adding favoriteStables to profiles table if it doesn't exist
-- 2. Dropping all forum-related tables and enums since they're not being used
-- 3. Ensuring a clean state for future migrations

-- Step 1: Add favoriteStables to profiles table if not exists
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "favoriteStables" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Drop forum tables if they exist (in correct dependency order)
DROP TABLE IF EXISTS "public"."forum_reactions" CASCADE;
DROP TABLE IF EXISTS "public"."forum_reports" CASCADE;
DROP TABLE IF EXISTS "public"."forum_subscriptions" CASCADE;
DROP TABLE IF EXISTS "public"."forum_thread_tags" CASCADE;
DROP TABLE IF EXISTS "public"."forum_posts" CASCADE;
DROP TABLE IF EXISTS "public"."forum_threads" CASCADE;
DROP TABLE IF EXISTS "public"."forum_user_stats" CASCADE;
DROP TABLE IF EXISTS "public"."forum_moderators" CASCADE;
DROP TABLE IF EXISTS "public"."forum_categories" CASCADE;
DROP TABLE IF EXISTS "public"."forum_tags" CASCADE;

-- Step 3: Drop forum enums if they exist
DROP TYPE IF EXISTS "public"."ReactionType" CASCADE;
DROP TYPE IF EXISTS "public"."ReportReason" CASCADE;
DROP TYPE IF EXISTS "public"."ReportStatus" CASCADE;