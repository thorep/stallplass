-- Fix box is_active default value to false
-- Boxes should only be active when user pays for advertising, not by default

ALTER TABLE boxes ALTER COLUMN is_active SET DEFAULT false;

-- Update existing boxes that might have been set to active incorrectly
-- Only keep boxes active if their stable has active advertising
UPDATE boxes 
SET is_active = false 
WHERE is_active = true 
AND stable_id IN (
  SELECT id FROM stables WHERE advertising_active = false
);