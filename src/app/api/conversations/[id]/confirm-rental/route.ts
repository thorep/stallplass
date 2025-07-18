import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { userId, startDate, endDate, monthlyPrice } = body;

    if (!userId || !startDate) {
      return NextResponse.json(
        { error: 'User ID and start date are required' },
        { status: 400 }
      );
    }

    // Get conversation and verify access
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { riderId: userId },
          { stable: { ownerId: userId } }
        ]
      },
      include: {
        box: true,
        stable: {
          select: {
            ownerId: true
          }
        },
        rider: {
          select: {
            id: true,
            name: true
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

    if (!conversation.boxId) {
      return NextResponse.json(
        { error: 'No box associated with this conversation' },
        { status: 400 }
      );
    }

    // Check if rental already exists
    const existingRental = await prisma.rental.findUnique({
      where: { conversationId }
    });

    if (existingRental) {
      return NextResponse.json(
        { error: 'Rental already confirmed for this conversation' },
        { status: 400 }
      );
    }

    // Create rental and update box availability
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create rental
      const rental = await tx.rental.create({
        data: {
          conversationId,
          riderId: conversation.riderId,
          stableId: conversation.stableId,
          boxId: conversation.boxId!,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          monthlyPrice: monthlyPrice || conversation.box!.price,
          status: 'ACTIVE'
        }
      });

      // Update box availability
      await tx.box.update({
        where: { id: conversation.boxId! },
        data: { isAvailable: false }
      });

      // Update conversation status
      await tx.conversation.update({
        where: { id: conversationId },
        data: { 
          status: 'RENTAL_CONFIRMED',
          updatedAt: new Date()
        }
      });

      // Create system message
      const isOwnerConfirming = conversation.stable.ownerId === userId;
      const messageContent = isOwnerConfirming 
        ? `Stallboksen "${conversation.box!.name}" er nå utleid til ${conversation.rider?.name || 'rytteren'}.`
        : `Du har bekreftet leie av stallboksen "${conversation.box!.name}".`;

      await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: messageContent,
          messageType: 'RENTAL_CONFIRMATION',
          metadata: {
            rentalId: rental.id,
            startDate: rental.startDate,
            endDate: rental.endDate,
            monthlyPrice: rental.monthlyPrice
          }
        }
      });

      return rental;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error confirming rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}