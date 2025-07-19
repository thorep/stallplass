import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const stables = await prisma.stable.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        _count: {
          select: {
            boxes: true,
            conversations: true,
            rentals: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(stables);
  } catch (error) {
    console.error('Error fetching stables:', error);
    return NextResponse.json({ error: 'Failed to fetch stables' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    await prisma.stable.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stable:', error);
    return NextResponse.json({ error: 'Failed to delete stable' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, featured } = body;

    if (!id) {
      return NextResponse.json({ error: 'Stable ID is required' }, { status: 400 });
    }

    const stable = await prisma.stable.update({
      where: { id },
      data: { featured },
    });

    return NextResponse.json(stable);
  } catch (error) {
    console.error('Error updating stable:', error);
    return NextResponse.json({ error: 'Failed to update stable' }, { status: 500 });
  }
}