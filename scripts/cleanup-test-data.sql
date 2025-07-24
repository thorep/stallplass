-- Cleanup Test Data
-- This script removes all test data created by seed-test-data.sql

BEGIN;

-- Delete in reverse order of dependencies

-- 1. Delete messages from test conversations
DELETE FROM public.messages
WHERE conversation_id IN (
  SELECT id FROM public.conversations
  WHERE stable_id LIKE 'test-stable-%'
);

-- 2. Delete conversations related to test stables
DELETE FROM public.conversations
WHERE stable_id LIKE 'test-stable-%';

-- 3. Delete reviews for test rentals
DELETE FROM public.reviews
WHERE rental_id IN (
  SELECT id FROM public.rentals
  WHERE stable_id LIKE 'test-stable-%'
);

-- 4. Delete rentals for test boxes
DELETE FROM public.rentals
WHERE stable_id LIKE 'test-stable-%'
OR box_id LIKE 'test-box-%';

-- 5. Delete box amenity links
DELETE FROM public.box_amenity_links
WHERE box_id LIKE 'test-box-%';

-- 6. Delete boxes
DELETE FROM public.boxes
WHERE id LIKE 'test-box-%';

-- 7. Delete stable amenity links
DELETE FROM public.stable_amenity_links
WHERE stable_id LIKE 'test-stable-%';

-- 8. Delete stables
DELETE FROM public.stables
WHERE id LIKE 'test-stable-%';

-- Note: We don't delete the user profiles for user3 and user4 
-- as they are needed for authentication tests

COMMIT;

-- Summary of cleanup
SELECT 'Test data cleaned up successfully!' as message;