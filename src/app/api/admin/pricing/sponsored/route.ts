import { NextRequest, NextResponse } from 'next/server';
import { updateSponsoredPlacementPrice } from '@/services/pricing-service';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { price } = await request.json();

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const updatedPrice = await updateSponsoredPlacementPrice(price);

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error('Error updating sponsored placement price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}