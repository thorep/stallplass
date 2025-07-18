import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {

    // Get conversations where user is either rider or stable owner
    // userId is now verified from the Firebase token
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { riderId: userId },
          { stable: { ownerId: userId } }
        ]
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
            ownerId: true
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            isRead: true
          }
        },
        rental: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(conversations);
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
    const stable = await prisma.stable.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (stable && stable.ownerId === userId) {
      return NextResponse.json(
        { error: 'Du kan ikke sende melding til din egen stall' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        riderId: userId, // Use authenticated user ID
        stableId,
        boxId: boxId || null
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        riderId: userId, // Use authenticated user ID
        stableId,
        boxId: boxId || null,
        messages: {
          create: {
            senderId: userId, // Use authenticated user ID
            content: initialMessage,
            messageType: 'TEXT'
          }
        }
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            ownerName: true
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        messages: true
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});