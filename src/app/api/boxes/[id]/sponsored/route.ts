import { NextRequest, NextResponse } from 'next/server';
import { purchaseSponsoredPlacement, getSponsoredPlacementInfo } from '@/services/box-service';
import { calculateSponsoredPlacementCost } from '@/services/pricing-service';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const sponsoredInfo = await getSponsoredPlacementInfo(id);
    
    return NextResponse.json(sponsoredInfo);
  } catch (error) {
    console.error('Error getting sponsored placement info:', error);
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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
    console.error('Error purchasing sponsored placement:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}