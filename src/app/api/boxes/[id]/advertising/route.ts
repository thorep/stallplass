import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { getBoxAdvertisingInfo } from '@/services/box-service';
import { createApiLogger } from '@/lib/logger';

/**
 * GET /api/boxes/[id]/advertising
 * Get advertising status for a specific box
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const advertisingInfo = await getBoxAdvertisingInfo(id);
    
    return NextResponse.json(advertisingInfo);
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: `/api/boxes/${id}/advertising`,
      method: 'GET',
      userId: undefined
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      boxId: id
    }, 'Failed to get box advertising info');

    if (error instanceof Error && error.message === 'Box not found') {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to get box advertising info' },
      { status: 500 }
    );
  }
}