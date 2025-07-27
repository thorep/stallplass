-- Step 1: Update all foreign key relationships to reference users.id instead of users.firebaseId

-- Update conversations table
ALTER TABLE conversations DROP CONSTRAINT "conversations_userId_fkey";
UPDATE conversations SET "userId" = users.id 
FROM users 
WHERE conversations."userId" = users."firebaseId";
ALTER TABLE conversations ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update messages table  
ALTER TABLE messages DROP CONSTRAINT "messages_senderId_fkey";
UPDATE messages SET "senderId" = users.id 
FROM users 
WHERE messages."senderId" = users."firebaseId";
ALTER TABLE messages ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update page_views table
ALTER TABLE page_views DROP CONSTRAINT "page_views_viewerId_fkey";
UPDATE page_views SET "viewerId" = users.id 
FROM users 
WHERE page_views."viewerId" = users."firebaseId";
ALTER TABLE page_views ADD CONSTRAINT "page_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES users(id);

-- Update payments table
ALTER TABLE payments DROP CONSTRAINT "payments_userId_fkey";
UPDATE payments SET "userId" = users.id 
FROM users 
WHERE payments."userId" = users."firebaseId";
ALTER TABLE payments ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update stables table
ALTER TABLE stables DROP CONSTRAINT "stables_ownerId_fkey";
UPDATE stables SET "ownerId" = users.id 
FROM users 
WHERE stables."ownerId" = users."firebaseId";
ALTER TABLE stables ADD CONSTRAINT "stables_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update services table
ALTER TABLE services DROP CONSTRAINT "services_userId_fkey";
UPDATE services SET "userId" = users.id 
FROM users 
WHERE services."userId" = users."firebaseId";
ALTER TABLE services ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Remove the firebaseId field
ALTER TABLE users DROP COLUMN "firebaseId";