import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getBasePriceObject, createOrUpdateBasePrice } from '@/services/pricing-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    // Try to get existing base price object
    const basePriceObject = await getBasePriceObject();
    
    if (basePriceObject) {
      return NextResponse.json(basePriceObject);
    }
    
    // If no base price exists, create a default one
    const defaultBasePrice = await createOrUpdateBasePrice(10);
    return NextResponse.json(defaultBasePrice);
  } catch (error) {
    console.error('Error fetching base grunnpris:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base price' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { price } = body;
    
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price is required and must be a positive number' },
        { status: 400 }
      );
    }
    
    // Create or update base price
    const basePrice = await createOrUpdateBasePrice(price);
    return NextResponse.json(basePrice);
  } catch (error) {
    console.error('Error updating base grunnpris:', error);
    return NextResponse.json(
      { error: 'Failed to update base price' },
      { status: 500 }
    );
  }
}