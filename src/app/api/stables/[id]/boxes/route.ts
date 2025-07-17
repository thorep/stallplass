import { NextRequest, NextResponse } from 'next/server';
import { getBoxesByStableId } from '@/services/box-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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