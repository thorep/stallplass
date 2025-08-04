import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

export const GET = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: profileId },
          { stable: { ownerId: profileId } }
        ]
      },
      include: {
        stable: {
          select: { ownerId: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages with sender information
    const messages = await prisma.messages.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read for current user
    await prisma.messages.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: profileId },
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    logger.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, messageType = 'TEXT', metadata } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: profileId },
          { stable: { ownerId: profileId } }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create message
    const newMessage = await prisma.messages.create({
      data: {
        conversationId: conversationId,
        senderId: profileId,
        content,
        messageType: messageType,
        metadata: metadata || null
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    logger.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});