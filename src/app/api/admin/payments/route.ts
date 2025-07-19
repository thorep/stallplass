import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firebaseId: true,
            email: true,
            name: true,
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}