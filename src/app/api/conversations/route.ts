import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // First get stable IDs owned by this user
    const ownedStables = await prisma.stables.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    const ownedStableIds = ownedStables.map(s => s.id);

    // Get conversations where user is either rider or stable owner
    const whereCondition = ownedStableIds.length > 0 
      ? {
          OR: [
            { riderId: userId },
            { stableId: { in: ownedStableIds } }
          ]
        }
      : { riderId: userId };

    const conversations = await prisma.conversations.findMany({
      where: whereCondition,
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
        },
        rentals: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get latest message and unread count for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        // Get latest message
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

        // Get unread count
        const unreadCount = await prisma.messages.count({
          where: {
            conversationId: conversation.id,
            isRead: false,
            senderId: { not: userId }
          }
        });

        return {
          ...conversation,
          messages: latestMessage ? [latestMessage] : [],
          _count: {
            messages: unreadCount
          }
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json();
    const { stableId, boxId, initialMessage } = body;

    if (!stableId || !initialMessage) {
      return NextResponse.json(
        { error: 'Stable ID and initial message are required' },
        { status: 400 }
      );
    }

    // Check if user is trying to message their own stable
    const stable = await prisma.stables.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    if (stable.ownerId === userId) {
      return NextResponse.json(
        { error: 'Du kan ikke sende melding til din egen stall' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        riderId: userId,
        stableId: stableId,
        boxId: boxId || null
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    const conversation = await prisma.conversations.create({
      data: {
        riderId: userId,
        stableId: stableId,
        boxId: boxId || null,
        updatedAt: new Date()
      }
    });

    // Create the initial message
    await prisma.messages.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: initialMessage,
        messageType: 'TEXT'
      }
    });

    // Fetch the complete conversation with all relations
    const completeConversation = await prisma.conversations.findUnique({
      where: { id: conversation.id },
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
            price: true
          }
        },
        messages: true
      }
    });

    return NextResponse.json(completeConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});