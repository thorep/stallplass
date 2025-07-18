import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, createUnauthorizedResponse } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const amenities = await prisma.boxAmenity.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching box amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box amenities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name } = body;
    
    const amenity = await prisma.boxAmenity.create({
      data: { name },
    });
    
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error creating box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to create box amenity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, name } = body;
    
    const amenity = await prisma.boxAmenity.update({
      where: { id },
      data: { name },
    });
    
    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error updating box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to update box amenity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.boxAmenity.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box amenity:', error);
    return NextResponse.json(
      { error: 'Failed to delete box amenity' },
      { status: 500 }
    );
  }
}