import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

export async function GET() {
  try {
    const horseSales = await prisma.horse_sales.findMany({
      where: {
        deletedAt: null,
        archived: false,
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        age: true,
        gender: true,
        size: true,
        height: true,
        address: true,
        postalCode: true,
        postalPlace: true,
        latitude: true,
        longitude: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        images: true,
        breed: {
          select: {
            id: true,
            name: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        profiles: {
          select: {
            id: true,
            nickname: true
          }
        },
        counties: {
          select: {
            id: true,
            name: true
          }
        },
        municipalities: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const horseSalesWithLocation = horseSales.map((horseSale) => {
      const location = [
        horseSale.address,
        horseSale.postalCode,
        horseSale.postalPlace
      ].filter(Boolean).join(', ') || 'Ingen adresse';
      
      // Format price in Norwegian format
      const formattedPrice = new Intl.NumberFormat('nb-NO', {
        style: 'currency',
        currency: 'NOK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(horseSale.price);

      return {
        ...horseSale,
        location,
        formattedPrice,
        breedName: horseSale.breed.name,
        disciplineName: horseSale.discipline.name,
        ownerName: horseSale.profiles.nickname,
        countyName: horseSale.counties?.name,
        municipalityName: horseSale.municipalities?.name
      };
    });

    return NextResponse.json({ data: horseSalesWithLocation });
  } catch (error) {
    console.error('Error fetching horse sales for map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch horse sales' },
      { status: 500 }
    );
  }
}