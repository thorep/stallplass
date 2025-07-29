import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { 
  getBoxAdvertisingPriceObject, 
  getSponsoredPlacementPriceObject, 
  getServiceBasePriceObject,
  createOrUpdateBoxAdvertisingPrice,
  createOrUpdateSponsoredPlacementPrice,
  createOrUpdateServiceBasePrice
} from '@/services/pricing-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    // Get all three pricing types
    const [boxAdvertising, boxBoost, serviceBase] = await Promise.all([
      getBoxAdvertisingPriceObject(),
      getSponsoredPlacementPriceObject(), 
      getServiceBasePriceObject()
    ]);

    // Create defaults if they don't exist
    const result = {
      boxAdvertising: boxAdvertising || await createOrUpdateBoxAdvertisingPrice(10),
      boxBoost: boxBoost || await createOrUpdateSponsoredPlacementPrice(2),
      serviceBase: serviceBase || await createOrUpdateServiceBasePrice(2)
    };
    
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
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
    const { boxAdvertising, boxBoost, serviceBase } = body;
    
    if (typeof boxAdvertising !== 'number' || boxAdvertising < 0 ||
        typeof boxBoost !== 'number' || boxBoost < 0 ||
        typeof serviceBase !== 'number' || serviceBase < 0) {
      return NextResponse.json(
        { error: 'All prices are required and must be positive numbers' },
        { status: 400 }
      );
    }
    
    // Update all three pricing types
    const [updatedBoxAdvertising, updatedBoxBoost, updatedServiceBase] = await Promise.all([
      createOrUpdateBoxAdvertisingPrice(boxAdvertising),
      createOrUpdateSponsoredPlacementPrice(boxBoost),
      createOrUpdateServiceBasePrice(serviceBase)
    ]);
    
    return NextResponse.json({
      boxAdvertising: updatedBoxAdvertising,
      boxBoost: updatedBoxBoost,
      serviceBase: updatedServiceBase
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}