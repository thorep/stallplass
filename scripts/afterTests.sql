-- Teardown after Cypress E2E: clear stables and all dependent rows
-- This will also remove related rows such as boxes, stable_faqs, amenity links, conversations, etc.
TRUNCATE TABLE "stables" RESTART IDENTITY CASCADE;