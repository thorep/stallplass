-- Update stables table address structure
-- Rename city to poststed (Norwegian postal term)
-- Remove county text field (use fylke_id relationship instead)

-- First, rename city column to poststed
ALTER TABLE stables 
  RENAME COLUMN city TO poststed;

-- Remove the county text field since we have fylke_id relationship
ALTER TABLE stables 
  DROP COLUMN county;

-- Add comment to document the address structure
COMMENT ON COLUMN stables.poststed IS 'Norwegian postal place name (e.g., Sandefjord, Stavern)';
COMMENT ON COLUMN stables.municipality IS 'Municipality name when different from poststed (e.g., Larvik for Stavern)';
COMMENT ON COLUMN stables.fylke_id IS 'Foreign key to fylker table for county relationship';
COMMENT ON COLUMN stables.kommune_id IS 'Foreign key to kommuner table for municipality relationship';