-- Migration to convert service_photos table to arrays in services table
-- This script moves data from the normalized service_photos table to arrays

-- First, update services table with image data from service_photos
UPDATE services SET 
  images = (
    SELECT COALESCE(ARRAY_AGG(sp.photoUrl ORDER BY sp.createdAt), ARRAY[]::text[])
    FROM service_photos sp 
    WHERE sp.serviceId = services.id
  ),
  imageDescriptions = (
    SELECT COALESCE(ARRAY_AGG(COALESCE(sp.description, '') ORDER BY sp.createdAt), ARRAY[]::text[])
    FROM service_photos sp 
    WHERE sp.serviceId = services.id
  )
WHERE EXISTS (
  SELECT 1 FROM service_photos WHERE serviceId = services.id
);

-- Drop the service_photos table (this is handled by Prisma migration)
-- DROP TABLE service_photos;