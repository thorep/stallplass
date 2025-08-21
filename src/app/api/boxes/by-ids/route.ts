import { NextRequest, NextResponse } from 'next/server';
import { getBoxesByIds } from '@/services/box-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';

/**
 * GET /api/boxes/by-ids?ids=id1,id2,id3
 * Fetch multiple boxes by their IDs
 * Used by bulk advertising page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(
        { error: 'Box IDs are required' },
        { status: 400 }
      );
    }

    const boxIds = idsParam.split(',').filter(id => id.trim().length > 0);
    
    if (boxIds.length === 0) {
      return NextResponse.json([]);
    }

    const boxes = await getBoxesByIds(boxIds);
    return NextResponse.json(boxes);
  } catch (error) {
    logger.error('Failed to fetch boxes by IDs:', error);
    const posthog = getPostHogServer();
    posthog.captureException(error, undefined, { context: 'boxes_by_ids' });
    return NextResponse.json(
      { error: 'Failed to fetch boxes' },
      { status: 500 }
    );
  }
}
