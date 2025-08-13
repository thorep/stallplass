import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export const GET = withAdminAuth(async () => {
  try {
    const horses = await prisma.horses.findMany({
      include: {
        profiles: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            nickname: true,
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            customLogs: true,
            horseShares: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(horses);
  } catch (error) {
    console.error('Error fetching admin horses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch horses' },
      { status: 500 }
    );
  }
});