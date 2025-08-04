import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

export const PUT = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: userId },
          { stable: { ownerId: userId } }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Mark all messages as read for current user (except own messages)
    await prisma.messages.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Mark messages read API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});