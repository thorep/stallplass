-- Dev import of locations (counties + municipalities) from exported INSERT statements.
-- Usage:
-- 1) In PROD, run scripts/export_locations_as_inserts.sql and copy the output.
-- 2) In DEV, open this file, paste the copied INSERT statements into the placeholders below, and run.

BEGIN;

-- Optional: start clean to ensure IDs match exactly (cascades will affect dependent rows)
-- TRUNCATE TABLE "municipalities" RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE "counties" RESTART IDENTITY CASCADE;

-- Paste exported COUNTIES inserts here
-- --------------------------------------------------
-- INSERT INTO "counties" ... ON CONFLICT ("id") DO UPDATE ... ;
-- (multiple lines)
-- --------------------------------------------------

-- Paste exported MUNICIPALITIES inserts here
-- --------------------------------------------------
-- INSERT INTO "municipalities" ... ON CONFLICT ("id") DO UPDATE ... ;
-- (multiple lines)
-- --------------------------------------------------

COMMIT;

