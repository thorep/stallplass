-- Add municipality field to stables table
-- This will store the kommune/municipality name as text alongside the foreign key reference

ALTER TABLE stables 
ADD COLUMN municipality TEXT;

-- Create index for performance
CREATE INDEX idx_stables_municipality ON stables(municipality);

-- Add comment for documentation  
COMMENT ON COLUMN stables.municipality IS 'Municipality/kommune name where the stable is located';