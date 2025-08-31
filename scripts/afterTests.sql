-- Teardown after Cypress E2E
-- It's safe to truncate stables (but not profiles)
TRUNCATE TABLE "stables" RESTART IDENTITY CASCADE;

-- Remove the 50 auto-generated test users (created in beforeTests.sql)
DELETE FROM profiles
WHERE nickname LIKE 'test_user_%';
