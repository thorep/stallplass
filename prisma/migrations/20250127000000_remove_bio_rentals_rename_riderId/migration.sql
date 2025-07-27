-- Step 1: Update any RENTAL_CONFIRMED conversations to ACTIVE
UPDATE conversations SET status = 'ACTIVE' WHERE status = 'RENTAL_CONFIRMED';

-- Step 2: Update any RENTAL_REQUEST or RENTAL_CONFIRMATION messages to TEXT
UPDATE messages SET "messageType" = 'TEXT' WHERE "messageType" IN ('RENTAL_REQUEST', 'RENTAL_CONFIRMATION');

-- Step 3: Drop dependent objects first
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;

-- Step 4: Remove bio column from users
ALTER TABLE users DROP COLUMN IF EXISTS bio;

-- Step 5: Rename riderId to userId in conversations
ALTER TABLE conversations RENAME COLUMN "riderId" TO "userId";

-- Step 6: Drop and recreate the unique constraint with new column name
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_riderId_stableId_boxId_key;
ALTER TABLE conversations ADD CONSTRAINT conversations_userId_stableId_boxId_key UNIQUE ("userId", "stableId", "boxId");

-- Step 7: Update the foreign key constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_riderId_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_userId_fkey 
  FOREIGN KEY ("userId") REFERENCES users("firebaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Remove enum values (this requires recreating the enums)
-- For ConversationStatus
CREATE TYPE "ConversationStatus_new" AS ENUM ('ACTIVE', 'ARCHIVED');
ALTER TABLE conversations ALTER COLUMN status TYPE "ConversationStatus_new" USING status::text::"ConversationStatus_new";
DROP TYPE "ConversationStatus";
ALTER TYPE "ConversationStatus_new" RENAME TO "ConversationStatus";

-- For MessageType
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'SYSTEM');
ALTER TABLE messages ALTER COLUMN "messageType" TYPE "MessageType_new" USING "messageType"::text::"MessageType_new";
DROP TYPE "MessageType";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";

-- Step 9: Drop unused enums
DROP TYPE IF EXISTS "RentalStatus";
DROP TYPE IF EXISTS "RevieweeType";