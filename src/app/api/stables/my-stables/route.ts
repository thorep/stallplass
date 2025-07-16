import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Du må være logget inn' },
        { status: 401 }
      );
    }

    const stables = await prisma.stable.findMany({
      where: {
        ownerId: session.user.id
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(stables);
  } catch (error) {
    console.error('Error fetching user stables:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente dine staller' },
      { status: 500 }
    );
  }
}