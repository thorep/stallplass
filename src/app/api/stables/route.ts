import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const stables = await prisma.stable.findMany({
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(stables);
  } catch (error) {
    console.error('Error fetching stables:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente staller' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      name,
      description,
      location,
      price,
      availableSpaces,
      totalSpaces,
      amenities,
      images,
      ownerPhone,
      ownerEmail
    } = data;

    // Validate required fields
    if (!name || !description || !location || !price || !totalSpaces) {
      return NextResponse.json(
        { error: 'Alle påkrevde felt må fylles ut' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Bruker ikke funnet' },
        { status: 404 }
      );
    }

    const stable = await prisma.stable.create({
      data: {
        name,
        description,
        location,
        price: parseInt(price),
        availableSpaces: parseInt(availableSpaces) || parseInt(totalSpaces),
        totalSpaces: parseInt(totalSpaces),
        amenities: amenities || [],
        images: images || [],
        ownerId: user.id,
        ownerName: user.name,
        ownerPhone: ownerPhone || user.phone || '',
        ownerEmail: ownerEmail || user.email,
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

    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    console.error('Error creating stable:', error);
    return NextResponse.json(
      { error: 'Kunne ikke opprette stall' },
      { status: 500 }
    );
  }
}