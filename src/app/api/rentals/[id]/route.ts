import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const rental = await prisma.rental.findFirst({
      where: {
        id,
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
            email: true
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
        conversation: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, status, endDate } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get rental and verify access
    const rental = await prisma.rental.findFirst({
      where: {
        id,
        OR: [
          { riderId: userId },
          { stable: { ownerId: userId } }
        ]
      },
      include: {
        stable: {
          select: {
            ownerId: true
          }
        },
        box: {
          select: {
            name: true
          }
        }
      }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found or access denied' },
        { status: 404 }
      );
    }

    // Update rental and box availability if ending rental
    const result = await prisma.$transaction(async (tx) => {
      const updatedRental = await tx.rental.update({
        where: { id },
        data: {
          status: status || rental.status,
          endDate: endDate ? new Date(endDate) : rental.endDate,
          updatedAt: new Date()
        }
      });

      // If rental is being ended, make box available again
      if (status === 'ENDED' || status === 'CANCELLED') {
        await tx.box.update({
          where: { id: rental.boxId },
          data: { isAvailable: true }
        });

        // Update conversation status
        await tx.conversation.update({
          where: { id: rental.conversationId },
          data: { 
            status: 'ARCHIVED',
            updatedAt: new Date()
          }
        });

        // Create system message
        const isOwnerEnding = rental.stable.ownerId === userId;
        const messageContent = isOwnerEnding
          ? `Leieforholdet for "${rental.box!.name}" er avsluttet av stalleier.`
          : `Du har avsluttet leieforholdet for "${rental.box!.name}".`;

        await tx.message.create({
          data: {
            conversationId: rental.conversationId,
            senderId: userId,
            content: messageContent,
            messageType: 'SYSTEM',
            metadata: {
              rentalId: rental.id,
              endDate: updatedRental.endDate,
              status: updatedRental.status
            }
          }
        });
      }

      return updatedRental;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}