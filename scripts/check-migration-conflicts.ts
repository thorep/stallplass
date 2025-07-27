import { prisma } from '../src/services/prisma';

async function checkMigrationConflicts() {
  console.log('Checking for migration conflicts...\n');

  // Check conversation statuses
  const conversationStatuses = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count 
    FROM conversations 
    GROUP BY status
  `;
  console.log('Conversation statuses:', conversationStatuses);

  // Check message types
  const messageTypes = await prisma.$queryRaw`
    SELECT "messageType", COUNT(*) as count 
    FROM messages 
    GROUP BY "messageType"
  `;
  console.log('\nMessage types:', messageTypes);

  // Check for duplicate conversations (userId, stableId, boxId)
  const duplicateConversations = await prisma.$queryRaw`
    SELECT "riderId", "stableId", "boxId", COUNT(*) as count
    FROM conversations
    GROUP BY "riderId", "stableId", "boxId"
    HAVING COUNT(*) > 1
  `;
  console.log('\nDuplicate conversations:', duplicateConversations);

  // Check if any rentals exist
  const rentalCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM rentals
  `;
  console.log('\nRental count:', rentalCount);

  // Check if any reviews exist
  const reviewCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM reviews
  `;
  console.log('\nReview count:', reviewCount);

  await prisma.$disconnect();
}

checkMigrationConflicts().catch(console.error);