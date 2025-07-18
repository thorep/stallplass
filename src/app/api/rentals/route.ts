import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'renter' or 'owner'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (type === 'renter') {
      // Get rentals where user is the renter
      const rentals = await prisma.rental.findMany({
        where: { 
          riderId: userId,
          status: 'ACTIVE'
        },
        include: {
          box: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              size: true,
              isIndoor: true,
              hasWindow: true,
              hasElectricity: true,
              hasWater: true,
              maxHorseSize: true,
              images: true
            }
          },
          stable: {
            select: {
              id: true,
              name: true,
              location: true,
              ownerName: true,
              ownerPhone: true,
              ownerEmail: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(rentals);
    } else if (type === 'owner') {
      // Get rentals for stables owned by the user
      const rentals = await prisma.rental.findMany({
        where: { 
          stable: {
            ownerId: userId
          },
          status: 'ACTIVE'
        },
        include: {
          box: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              size: true,
              isIndoor: true,
              hasWindow: true,
              hasElectricity: true,
              hasWater: true,
              maxHorseSize: true,
              images: true
            }
          },
          stable: {
            select: {
              id: true,
              name: true,
              location: true
            }
          },
          rider: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(rentals);
    } else {
      return NextResponse.json(
        { error: 'Type parameter must be either "renter" or "owner"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}