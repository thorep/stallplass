import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, createUnauthorizedResponse } from '@/lib/admin-auth';
import { getBasePrice, getBasePriceObject, updateBasePrice } from '@/services/pricing-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return createUnauthorizedResponse();
  }

  try {
    const basePrice = await getBasePrice();
    return NextResponse.json(basePrice);
  } catch (error) {
    console.error('Error fetching base price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base price' },
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
    const { price } = body;
    
    // Get existing base price to update
    const existingBasePrice = await getBasePriceObject();
    if (!existingBasePrice) {
      return NextResponse.json(
        { error: 'No base price found to update' },
        { status: 404 }
      );
    }
    
    const updatedBasePrice = await updateBasePrice(existingBasePrice.id, price);
    return NextResponse.json(updatedBasePrice);
  } catch (error) {
    console.error('Error updating base price:', error);
    return NextResponse.json(
      { error: 'Failed to update base price' },
      { status: 500 }
    );
  }
}