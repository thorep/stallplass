-- Mark the migration as applied since favoriteStables column already exists
-- First check if it already exists, if not insert it
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") 
SELECT 
  gen_random_uuid(),
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  NOW(),
  '20250809223738_add_favorite_stables_to_profiles',
  NULL,
  NULL,
  NOW(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations" 
  WHERE "migration_name" = '20250809223738_add_favorite_stables_to_profiles'
);