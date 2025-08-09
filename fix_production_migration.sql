-- Manual fix for failed migration in production
-- Run this SQL directly against your production database

-- Step 1: Remove the failed migration record from _prisma_migrations table
DELETE FROM "_prisma_migrations" 
WHERE "migration_name" = '20250809223738_add_favorite_stables_to_profiles';

-- Step 2: Add the favoriteStables field to profiles table if it doesn't exist
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "favoriteStables" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 3: Drop forum tables and enums (if they exist) to prevent conflicts
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

-- Step 4: Drop forum enums
DROP TYPE IF EXISTS "public"."ReactionType" CASCADE;
DROP TYPE IF EXISTS "public"."ReportReason" CASCADE;
DROP TYPE IF EXISTS "public"."ReportStatus" CASCADE;