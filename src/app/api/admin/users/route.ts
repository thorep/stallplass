import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firebaseId: true,
        email: true,
        name: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stables: true,
            rentals: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAdmin } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}