-- Remove duplicate owner fields from stables table since owner_id already exists

-- Step 1: Make sure owner_id is set for all existing stables
-- Since this is development, we'll just delete any stables without owner_id
DELETE FROM stables WHERE owner_id IS NULL;

-- Step 2: Make owner_id required
ALTER TABLE stables 
ALTER COLUMN owner_id SET NOT NULL;

-- Step 3: Remove duplicate columns that duplicate user data
ALTER TABLE stables 
DROP COLUMN IF EXISTS owner_name,
DROP COLUMN IF EXISTS owner_email,
DROP COLUMN IF EXISTS owner_phone;

-- Step 4: Update RLS policies to use owner_id (if they don't already)
DROP POLICY IF EXISTS "Users can view their own stables" ON stables;
DROP POLICY IF EXISTS "Users can create their own stables" ON stables;
DROP POLICY IF EXISTS "Users can update their own stables" ON stables;
DROP POLICY IF EXISTS "Users can delete their own stables" ON stables;

-- Create new RLS policies using owner_id
CREATE POLICY "Users can view their own stables" ON stables
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own stables" ON stables
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own stables" ON stables
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own stables" ON stables
    FOR DELETE USING (owner_id = auth.uid());

-- Step 5: Add phone field to users table as optional field for user profiles
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone text;