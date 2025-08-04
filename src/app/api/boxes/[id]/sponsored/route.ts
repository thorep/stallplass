import { NextRequest, NextResponse } from 'next/server';
import { purchaseSponsoredPlacement, getSponsoredPlacementInfo } from '@/services/box-service';
import { calculateSponsoredPlacementCost } from '@/services/pricing-service';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

const apiLogger = createApiLogger({ 
  endpoint: "/api/boxes/:id/sponsored", 
  requestId: crypto.randomUUID() 
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sponsoredInfo = await getSponsoredPlacementInfo(id);
    
    return NextResponse.json(sponsoredInfo);
  } catch (error) {
    apiLogger.error({
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { days } = await request.json();

    if (!days || days < 1) {
      return NextResponse.json({ error: 'Invalid number of days' }, { status: 400 });
    }

    // Calculate cost for this purchase
    const costInfo = await calculateSponsoredPlacementCost(days);
    
    // Purchase sponsored placement
    const updatedBox = await purchaseSponsoredPlacement(id, days);
    
    return NextResponse.json({
      box: updatedBox,
      cost: costInfo
    });
  } catch (error) {
    apiLogger.error({
      method: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}