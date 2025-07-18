import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, createUnauthorizedResponse } from '@/lib/admin-auth';
import { getAllDiscounts } from '@/services/pricing-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const discounts = await getAllDiscounts();
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
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
    const { months, percentage, isActive } = body;
    
    const discount = await prisma.pricingDiscount.create({
      data: {
        months,
        percentage,
        isActive: isActive ?? true,
      },
    });
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
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
    const { id, months, percentage, isActive } = body;
    
    const discount = await prisma.pricingDiscount.update({
      where: { id },
      data: {
        months,
        percentage,
        isActive,
      },
    });
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
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
    
    await prisma.pricingDiscount.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}