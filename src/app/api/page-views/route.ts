import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const validEntityTypes: EntityType[] = ['STABLE', 'BOX', 'SERVICE'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Increment the view counter for the appropriate entity
    let result;
    
    if (entityType === 'STABLE') {
      result = await prisma.stables.update({
        where: { id: entityId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true }
      });
    } else if (entityType === 'BOX') {
      result = await prisma.boxes.update({
        where: { id: entityId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true }
      });
    } else if (entityType === 'SERVICE') {
      result = await prisma.services.update({
        where: { id: entityId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true }
      });
    }

    return NextResponse.json({ 
      entityType, 
      entityId, 
      viewCount: result?.viewCount || 0 
    }, { status: 200 });
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}