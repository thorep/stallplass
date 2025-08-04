import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

/**
 * GET /api/admin/services
 * Get all services for admin (including archived)
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const services = await prisma.services.findMany({
      include: {
        profiles: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            firstname: true,
            lastname: true
          }
        },
        service_types: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        service_areas: {
          select: {
            id: true,
            county: true,
            municipality: true
          }
        },
        _count: {
          select: {
            service_areas: true
          }
        }
      },
      orderBy: [
        { archived: 'asc' }, // Show active services first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching admin services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
});