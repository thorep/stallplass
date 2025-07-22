-- Complete service_type enum creation for production database
-- Run this SQL in your production Supabase database
-- 
-- ASSUMPTION: Production has NO service_type enum yet
-- This creates the complete enum with all 6 service types

-- Create the service_type enum with all values
CREATE TYPE service_type AS ENUM (
  'veterinarian',
  'farrier', 
  'trainer',
  'chiropractor',
  'saddlefitter',
  'equestrian_shop'
);

-- Verify all 6 types are now present (optional check)
-- SELECT unnest(enum_range(NULL::service_type)) AS all_service_types;
-- Expected result: veterinarian, farrier, trainer, chiropractor, saddlefitter, equestrian_shop