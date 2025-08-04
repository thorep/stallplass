import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

export const GET = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation and get full details
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: userId },
          { stable: { ownerId: userId } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get latest message and unread count
    const latestMessage = await prisma.messages.findFirst({
      where: { conversationId: conversation.id },
      select: {
        id: true,
        content: true,
        messageType: true,
        createdAt: true,
        isRead: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const unreadCount = await prisma.messages.count({
      where: {
        conversationId: conversation.id,
        isRead: false,
        senderId: { not: userId }
      }
    });

    // Add metadata to the conversation
    const conversationWithDetails = {
      ...conversation,
      messages: latestMessage ? [latestMessage] : [],
      _count: {
        messages: unreadCount
      }
    };

    return NextResponse.json(conversationWithDetails);
  } catch (error) {
    logger.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});