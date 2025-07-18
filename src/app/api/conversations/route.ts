import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get conversations where user is either rider or stable owner
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riderId, stableId, boxId, initialMessage } = body;

    if (!riderId || !stableId || !initialMessage) {
      return NextResponse.json(
        { error: 'Rider ID, stable ID, and initial message are required' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findUnique({
      where: {
        riderId_stableId_boxId: {
          riderId,
          stableId,
          boxId: boxId || null
        }
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        riderId,
        stableId,
        boxId: boxId || null,
        messages: {
          create: {
            senderId: riderId,
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
}