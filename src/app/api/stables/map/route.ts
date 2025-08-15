import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

export async function GET() {
  try {
    const stables = await prisma.stables.findMany({
      where: {
        deletedAt: null,
        AND: [
          { latitude: { not: 0 } },
          { longitude: { not: 0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        postalCode: true,
        postalPlace: true,
        latitude: true,
        longitude: true,
        images: true,
        boxes: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            availableQuantity: true,
            price: true
          }
        }
      }
    });

    const stablesWithStats = stables.map((stable) => {
      const availableBoxes = stable.boxes.reduce((total, box) => total + (box.availableQuantity || 0), 0);
      const prices = stable.boxes
        .map((box) => box.price)
        .filter((price): price is number => price !== null && price > 0);
      
      const location = [
        stable.address,
        stable.postalCode,
        stable.postalPlace
      ].filter(Boolean).join(', ') || 'Ingen adresse';
      
      return {
        ...stable,
        location,
        availableBoxes,
        priceRange: prices.length > 0 ? {
          min: Math.min(...prices),
          max: Math.max(...prices)
        } : null
      };
    });

    return NextResponse.json({ data: stablesWithStats });
  } catch (error) {
    console.error('Error fetching stables for map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stables' },
      { status: 500 }
    );
  }
}