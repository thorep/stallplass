import { prisma } from '../src/services/prisma';

async function checkMigrationConflicts() {

  // Check conversation statuses
  const conversationStatuses = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count 
    FROM conversations 
    GROUP BY status
  `;

  // Check message types
  const messageTypes = await prisma.$queryRaw`
    SELECT "messageType", COUNT(*) as count 
    FROM messages 
    GROUP BY "messageType"
  `;

  // Check for duplicate conversations (userId, stableId, boxId)
  const duplicateConversations = await prisma.$queryRaw`
    SELECT "riderId", "stableId", "boxId", COUNT(*) as count
    FROM conversations
    GROUP BY "riderId", "stableId", "boxId"
    HAVING COUNT(*) > 1
  `;

  // Check if any rentals exist
  const rentalCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM rentals
  `;

  // Check if any reviews exist
  const reviewCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM reviews
  `;

  await prisma.$disconnect();
}

