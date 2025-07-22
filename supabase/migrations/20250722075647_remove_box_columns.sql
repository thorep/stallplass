-- Remove unused columns from stallplasser table (Norwegian name at this point)
ALTER TABLE stallplasser 
DROP COLUMN IF EXISTS "isIndoor",
DROP COLUMN IF EXISTS "hasWindow", 
DROP COLUMN IF EXISTS "hasElectricity",
DROP COLUMN IF EXISTS "hasWater";