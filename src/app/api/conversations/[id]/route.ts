import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';

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
          { stables: { ownerId: userId } }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stables: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        boxes: {
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

    // Transform the response to match component expectations
    const conversationWithDetails = {
      ...conversation,
      stable: {
        ...conversation.stables,
        owner: conversation.stables?.users // Map stable.users -> stable.owner
      },
      rider: conversation.users, // Map users -> rider for component compatibility
      messages: latestMessage ? [latestMessage] : [],
      _count: {
        messages: unreadCount
      }
    };

    // Remove the plural versions to avoid confusion
    const result = { ...conversationWithDetails };
    delete (result as any).stables;
    delete (result as any).users;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});