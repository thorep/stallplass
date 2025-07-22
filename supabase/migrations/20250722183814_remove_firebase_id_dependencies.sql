-- Remove firebase_id dependencies and update foreign keys to use UUID id
-- This migration safely transitions from firebase_id to id as primary identifier

-- Step 1: Add temporary id columns to tables that reference firebase_id
-- This allows us to populate them before changing constraints

-- Add user_uuid to conversations table
ALTER TABLE conversations ADD COLUMN user_uuid UUID;

-- Add user_uuid to messages table  
ALTER TABLE messages ADD COLUMN user_uuid UUID;

-- Add user_uuid to page_views table
ALTER TABLE page_views ADD COLUMN user_uuid UUID;

-- Add user_uuid to payments table
ALTER TABLE payments ADD COLUMN user_uuid UUID;

-- Add user_uuid to rentals table
ALTER TABLE rentals ADD COLUMN user_uuid UUID;

-- Add user_uuid to reviews table (for both reviewer and reviewee)
ALTER TABLE reviews ADD COLUMN reviewer_uuid UUID;
ALTER TABLE reviews ADD COLUMN reviewee_uuid UUID;

-- Add user_uuid to stables table
ALTER TABLE stables ADD COLUMN user_uuid UUID;

-- Step 2: Populate the new UUID columns by joining with users table
UPDATE conversations 
SET user_uuid = users.id 
FROM users 
WHERE conversations.rider_id = users.firebase_id;

UPDATE messages 
SET user_uuid = users.id 
FROM users 
WHERE messages.sender_id = users.firebase_id;

UPDATE page_views 
SET user_uuid = users.id 
FROM users 
WHERE page_views.viewer_id = users.firebase_id;

UPDATE payments 
SET user_uuid = users.id 
FROM users 
WHERE payments.user_id = users.firebase_id;

UPDATE rentals 
SET user_uuid = users.id 
FROM users 
WHERE rentals.rider_id = users.firebase_id;

UPDATE reviews 
SET reviewer_uuid = users.id 
FROM users 
WHERE reviews.reviewer_id = users.firebase_id;

UPDATE reviews 
SET reviewee_uuid = users.id 
FROM users 
WHERE reviews.reviewee_id = users.firebase_id;

UPDATE stables 
SET user_uuid = users.id 
FROM users 
WHERE stables.owner_id = users.firebase_id;

-- Step 3: Drop RLS policies that depend on the columns we're changing
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view own page views" ON page_views;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own rentals" ON rentals;
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can manage own stables" ON stables;
DROP POLICY IF EXISTS "Users can update own stables" ON stables;
DROP POLICY IF EXISTS "Users can create stables" ON stables;
DROP POLICY IF EXISTS "Stable owners can manage boxes" ON boxes;
DROP POLICY IF EXISTS "Stable owners can manage own articles" ON stable_articles;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Step 4: Drop existing foreign key constraints
ALTER TABLE conversations DROP CONSTRAINT conversations_rider_id_fkey;
ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
ALTER TABLE page_views DROP CONSTRAINT page_views_viewer_id_fkey;
ALTER TABLE payments DROP CONSTRAINT payments_user_id_fkey;
ALTER TABLE rentals DROP CONSTRAINT rentals_rider_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT reviews_reviewer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT reviews_reviewee_id_fkey;
ALTER TABLE stables DROP CONSTRAINT stables_owner_id_fkey;

-- Step 5: Drop the old firebase_id columns and rename UUID columns
ALTER TABLE conversations DROP COLUMN rider_id;
ALTER TABLE conversations RENAME COLUMN user_uuid TO rider_id;

ALTER TABLE messages DROP COLUMN sender_id;
ALTER TABLE messages RENAME COLUMN user_uuid TO sender_id;

ALTER TABLE page_views DROP COLUMN viewer_id;
ALTER TABLE page_views RENAME COLUMN user_uuid TO viewer_id;

ALTER TABLE payments DROP COLUMN user_id;
ALTER TABLE payments RENAME COLUMN user_uuid TO user_id;

ALTER TABLE rentals DROP COLUMN rider_id;
ALTER TABLE rentals RENAME COLUMN user_uuid TO rider_id;

ALTER TABLE reviews DROP COLUMN reviewer_id;
ALTER TABLE reviews RENAME COLUMN reviewer_uuid TO reviewer_id;
ALTER TABLE reviews DROP COLUMN reviewee_id;
ALTER TABLE reviews RENAME COLUMN reviewee_uuid TO reviewee_id;

ALTER TABLE stables DROP COLUMN owner_id;
ALTER TABLE stables RENAME COLUMN user_uuid TO owner_id;

-- Step 6: Add new foreign key constraints referencing users.id
ALTER TABLE conversations ADD CONSTRAINT conversations_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id);
ALTER TABLE page_views ADD CONSTRAINT page_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES users(id);
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE rentals ADD CONSTRAINT rentals_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES users(id);
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES users(id);
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES users(id);
ALTER TABLE stables ADD CONSTRAINT stables_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);

-- Step 7: Make the new columns NOT NULL where appropriate
ALTER TABLE conversations ALTER COLUMN rider_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE rentals ALTER COLUMN rider_id SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN reviewer_id SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN reviewee_id SET NOT NULL;
ALTER TABLE stables ALTER COLUMN owner_id SET NOT NULL;

-- Step 8: Drop firebase_id column from users table and remove unique constraint
ALTER TABLE users DROP CONSTRAINT users_firebase_id_key;
ALTER TABLE users DROP COLUMN firebase_id;

-- Step 9: Also remove firebase_id from payments table as it's redundant
ALTER TABLE payments DROP COLUMN firebase_id;

-- Step 10: Recreate RLS policies using the new column names
-- Note: These policies may need to be adjusted based on your security requirements
CREATE POLICY "Users can view own conversations" ON conversations 
  FOR SELECT USING (rider_id = auth.uid()::uuid);

CREATE POLICY "Users can view messages in their conversations" ON messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.rider_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can view own page views" ON page_views 
  FOR SELECT USING (viewer_id = auth.uid()::uuid);

CREATE POLICY "Users can view own payments" ON payments 
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view own rentals" ON rentals 
  FOR SELECT USING (rider_id = auth.uid()::uuid);

CREATE POLICY "Users can view own reviews" ON reviews 
  FOR SELECT USING (reviewer_id = auth.uid()::uuid OR reviewee_id = auth.uid()::uuid);

CREATE POLICY "Users can manage own stables" ON stables 
  FOR ALL USING (owner_id = auth.uid()::uuid);

CREATE POLICY "Users can update own stables" ON stables 
  FOR UPDATE USING (owner_id = auth.uid()::uuid);

CREATE POLICY "Users can create stables" ON stables 
  FOR INSERT WITH CHECK (owner_id = auth.uid()::uuid);

CREATE POLICY "Stable owners can manage boxes" ON boxes 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stables 
      WHERE stables.id = boxes.stable_id 
      AND stables.owner_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Stable owners can manage own articles" ON stable_articles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stables 
      WHERE stables.id = stable_articles.stable_id 
      AND stables.owner_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (id = auth.uid()::uuid);