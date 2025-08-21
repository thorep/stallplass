import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  try {
    const services = await prisma.services.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        address: true,
        postalCode: true,
        postalPlace: true,
        latitude: true,
        longitude: true,
        priceRangeMin: true,
        priceRangeMax: true,
        contactEmail: true,
        contactPhone: true,
        profiles: {
          select: {
            nickname: true
          }
        },
        service_types: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });

    const servicesWithLocation = services.map((service) => {
      const location = [
        service.address,
        service.postalCode,
        service.postalPlace
      ].filter(Boolean).join(', ') || 'Ingen adresse';
      
      return {
        ...service,
        location,
        providerName: service.profiles.nickname,
        serviceType: service.service_types?.displayName || service.service_types?.name || 'Tjeneste'
      };
    });

    return NextResponse.json({ data: servicesWithLocation });
  } catch (error) {
    console.error('Error fetching services for map:', error);
    try { captureApiError({ error, context: 'services_map_get', route: '/api/services/map', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
