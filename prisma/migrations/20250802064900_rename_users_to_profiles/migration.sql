-- Rename users table to profiles
ALTER TABLE "users" RENAME TO "profiles";

-- Update foreign key constraint names to reflect the new table name
-- conversations table
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_userId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- invoice_requests table  
ALTER TABLE "invoice_requests" DROP CONSTRAINT "invoice_requests_userId_fkey";
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- messages table
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- services table
ALTER TABLE "services" DROP CONSTRAINT "services_userId_fkey";
ALTER TABLE "services" ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- stables table
ALTER TABLE "stables" DROP CONSTRAINT "stables_ownerId_fkey";
ALTER TABLE "stables" ADD CONSTRAINT "stables_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;