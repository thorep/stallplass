import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const boxes = await prisma.box.findMany({
      include: {
        stable: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            owner: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            conversations: true,
            rentals: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'Box ID is required' }, { status: 400 });
    }

    const updateData: { isAvailable?: boolean } = {};
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable;

    const box = await prisma.box.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(box);
  } catch (error) {
    console.error('Error updating box:', error);
    return NextResponse.json({ error: 'Failed to update box' }, { status: 500 });
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
      return NextResponse.json({ error: 'Box ID is required' }, { status: 400 });
    }

    await prisma.box.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box:', error);
    return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 });
  }
}