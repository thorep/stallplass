-- Optional performance indexes for ILIKE/contains text search
-- Run in Supabase SQL editor. Safe to run multiple times.

-- Enable extension once
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Stables name/description
CREATE INDEX IF NOT EXISTS stables_name_trgm ON "stables" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS stables_description_trgm ON "stables" USING GIN (description gin_trgm_ops);

-- Boxes name/description
CREATE INDEX IF NOT EXISTS boxes_name_trgm ON "boxes" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS boxes_description_trgm ON "boxes" USING GIN (description gin_trgm_ops);

-- Services title/description
CREATE INDEX IF NOT EXISTS services_title_trgm ON "services" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS services_description_trgm ON "services" USING GIN (description gin_trgm_ops);

-- Profiles nickname search
CREATE INDEX IF NOT EXISTS profiles_nickname_trgm ON "profiles" USING GIN (nickname gin_trgm_ops);

-- Forum posts title/content (if used for search)
CREATE INDEX IF NOT EXISTS forum_posts_title_trgm ON "forum_posts" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS forum_posts_content_trgm ON "forum_posts" USING GIN (content gin_trgm_ops);

