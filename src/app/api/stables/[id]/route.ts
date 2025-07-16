import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id } = await params;
    
    // Check if user owns this stable
    const existingStable = await prisma.stable.findUnique({
      where: { id }
    });

    if (!existingStable) {
      return NextResponse.json(
        { error: 'Stall ikke funnet' },
        { status: 404 }
      );
    }

    if (existingStable.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å redigere denne stallen' },
        { status: 403 }
      );
    }

    const updatedStable = await prisma.stable.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        price: parseInt(data.price),
        availableSpaces: parseInt(data.availableSpaces),
        totalSpaces: parseInt(data.totalSpaces),
        amenities: data.amenities || [],
        images: data.images || [],
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedStable);
  } catch (error) {
    console.error('Error updating stable:', error);
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere stall' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if user owns this stable
    const existingStable = await prisma.stable.findUnique({
      where: { id }
    });

    if (!existingStable) {
      return NextResponse.json(
        { error: 'Stall ikke funnet' },
        { status: 404 }
      );
    }

    if (existingStable.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å slette denne stallen' },
        { status: 403 }
      );
    }

    await prisma.stable.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Stall slettet' });
  } catch (error) {
    console.error('Error deleting stable:', error);
    return NextResponse.json(
      { error: 'Kunne ikke slette stall' },
      { status: 500 }
    );
  }
}