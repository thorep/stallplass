import { NextRequest, NextResponse } from 'next/server';
import { getBoxesByStableId } from '@/services/box-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const boxes = await getBoxesByStableId(params.id);
    
    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes for stable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boxes' },
      { status: 500 }
    );
  }
}