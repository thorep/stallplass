-- RLS (Row Level Security) Policies for Stallplass Chat System
-- This file can be executed in both local and production environments
-- 
-- Usage:
-- 1. Connect to your database (local or production)
-- 2. Run this entire file to set up all RLS policies
-- 3. Verify policies are working as expected

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table  
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CONVERSATIONS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Stable owners can view conversations about their stables" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Stable owners can update conversations about their stables" ON conversations;

-- Policy: Users can view conversations they started
CREATE POLICY "Users can view their own conversations" 
ON conversations FOR SELECT 
TO authenticated 
USING (
  auth.uid()::text = "userId"
);

-- Policy: Stable owners can view conversations about their stables
CREATE POLICY "Stable owners can view conversations about their stables" 
ON conversations FOR SELECT 
TO authenticated 
USING (
  auth.uid()::text IN (
    SELECT "ownerId" 
    FROM stables 
    WHERE stables.id = conversations."stableId"
  )
);

-- Policy: Authenticated users can create conversations
CREATE POLICY "Users can create conversations" 
ON conversations FOR INSERT 
TO authenticated 
WITH CHECK (
  -- User can only create conversations as themselves
  auth.uid()::text = "userId"
  AND
  -- Must be about an existing stable
  EXISTS (
    SELECT 1 FROM stables WHERE stables.id = conversations."stableId"
  )
  AND
  -- If boxId is specified, it must exist and belong to the stable
  (
    conversations."boxId" IS NULL 
    OR 
    EXISTS (
      SELECT 1 FROM boxes 
      WHERE boxes.id = conversations."boxId" 
      AND boxes."stableId" = conversations."stableId"
    )
  )
);

-- Policy: Users can update their own conversations (status, etc.)
CREATE POLICY "Users can update their own conversations" 
ON conversations FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Policy: Stable owners can update conversations about their stables
CREATE POLICY "Stable owners can update conversations about their stables" 
ON conversations FOR UPDATE 
TO authenticated 
USING (
  auth.uid()::text IN (
    SELECT "ownerId" 
    FROM stables 
    WHERE stables.id = conversations."stableId"
  )
)
WITH CHECK (
  auth.uid()::text IN (
    SELECT "ownerId" 
    FROM stables 
    WHERE stables.id = conversations."stableId"
  )
);

-- =============================================================================
-- MESSAGES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Policy: Users can view messages in conversations they have access to
CREATE POLICY "Users can view messages in their conversations" 
ON messages FOR SELECT 
TO authenticated 
USING (
  -- User is part of the conversation (either as starter or stable owner)
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages."conversationId"
    AND (
      -- User started the conversation
      conversations."userId" = auth.uid()::text
      OR
      -- User owns the stable
      auth.uid()::text IN (
        SELECT "ownerId" 
        FROM stables 
        WHERE stables.id = conversations."stableId"
      )
    )
  )
);

-- Policy: Users can send messages in conversations they have access to
CREATE POLICY "Users can send messages in their conversations" 
ON messages FOR INSERT 
TO authenticated 
WITH CHECK (
  -- User can only send messages as themselves
  auth.uid()::text = "senderId"
  AND
  -- User has access to the conversation
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages."conversationId"
    AND (
      -- User started the conversation
      conversations."userId" = auth.uid()::text
      OR
      -- User owns the stable
      auth.uid()::text IN (
        SELECT "ownerId" 
        FROM stables 
        WHERE stables.id = conversations."stableId"
      )
    )
  )
  AND
  -- Conversation is still active (not archived or blocked)
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages."conversationId"
    AND conversations.status = 'ACTIVE'
  )
);

-- Policy: Users can update their own messages (for read receipts, edits, etc.)
CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE 
TO authenticated 
USING (
  -- Either the user sent the message
  auth.uid()::text = "senderId"
  OR
  -- Or the user has access to the conversation (for read receipts)
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages."conversationId"
    AND (
      conversations."userId" = auth.uid()::text
      OR
      auth.uid()::text IN (
        SELECT "ownerId" 
        FROM stables 
        WHERE stables.id = conversations."stableId"
      )
    )
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid()::text = "senderId"
  OR
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages."conversationId"
    AND (
      conversations."userId" = auth.uid()::text
      OR
      auth.uid()::text IN (
        SELECT "ownerId" 
        FROM stables 
        WHERE stables.id = conversations."stableId"
      )
    )
  )
);

-- =============================================================================
-- REALTIME POLICIES (for Supabase Realtime)
-- =============================================================================

-- These policies control what real-time updates users can receive
-- They should match the SELECT policies above

-- Enable realtime for authenticated users on messages they can access
-- (This is handled automatically by Supabase based on the SELECT policies above)

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Use these queries to test that RLS is working correctly:

/*
-- Test 1: Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages');
-- Should show rowsecurity = true for both tables

-- Test 2: Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;
-- Should show all the policies we created

-- Test 3: Test as different users (replace 'user-uuid' with actual UUIDs)
-- Set session to simulate different users:
-- SELECT set_config('request.jwt.claims', '{"sub":"user-uuid-here"}', true);

-- Then test queries:
-- SELECT COUNT(*) FROM conversations; -- Should only show user's conversations
-- SELECT COUNT(*) FROM messages; -- Should only show accessible messages
*/

-- =============================================================================
-- NOTES AND SECURITY CONSIDERATIONS
-- =============================================================================

/*
IMPORTANT SECURITY NOTES:

1. USER IDENTIFICATION:
   - All policies use auth.uid()::text to get the current user's ID
   - This works with Supabase Auth JWT tokens
   - Make sure your frontend always sends valid JWT tokens

2. CONVERSATION ACCESS:
   - Users can access conversations they started (userId matches)
   - Stable owners can access conversations about their stables
   - No one else can access conversations

3. MESSAGE ACCESS:
   - Users can only see messages in conversations they have access to
   - Users can only send messages as themselves
   - Messages can only be sent to active conversations

4. ADMIN ACCESS:
   - These policies don't include admin overrides
   - Add separate admin policies if needed for support/moderation

5. PERFORMANCE:
   - Policies use indexes on userId, stableId, ownerId for performance
   - Consider adding composite indexes if queries are slow

6. SOFT DELETE FUTURE-PROOFING:
   - When implementing soft delete (archived=true instead of DELETE)
   - Update policies to exclude archived records from normal queries
   - Example: AND stables.archived = false

7. TESTING:
   - Always test RLS policies thoroughly in development
   - Use different user accounts to verify isolation
   - Test edge cases like deleted stables/boxes

8. DEBUGGING:
   - If queries return no results, check RLS policies
   - Use EXPLAIN to see if policies are being applied
   - Check that JWT tokens contain correct user IDs
*/