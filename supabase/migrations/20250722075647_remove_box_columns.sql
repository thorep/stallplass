-- Remove unused columns from boxes table
ALTER TABLE boxes 
DROP COLUMN IF EXISTS "isIndoor",
DROP COLUMN IF EXISTS "hasWindow", 
DROP COLUMN IF EXISTS "hasElectricity",
DROP COLUMN IF EXISTS "hasWater";