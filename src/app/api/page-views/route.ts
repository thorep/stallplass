import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';
import { logger, createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, viewerId } = body;

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

    // For authenticated users, check if they own the content and skip if they do
    if (viewerId && !viewerId.startsWith('anon-')) {
      let isOwner = false;
      
      if (entityType === 'STABLE') {
        const stable = await prisma.stables.findUnique({
          where: { id: entityId },
          select: { ownerId: true }
        });
        isOwner = stable?.ownerId === viewerId;
      } else if (entityType === 'BOX') {
        const box = await prisma.boxes.findUnique({
          where: { id: entityId },
          select: { stables: { select: { ownerId: true } } }
        });
        isOwner = box?.stables?.ownerId === viewerId;
      } else if (entityType === 'SERVICE') {
        const service = await prisma.services.findUnique({
          where: { id: entityId },
          select: { userId: true }
        });
        isOwner = service?.userId === viewerId;
      }
      
      if (isOwner) {
        return NextResponse.json({ 
          entityType, 
          entityId, 
          skipped: true,
          reason: 'Owner views are not tracked'
        }, { status: 200 });
      }
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
    logger.error('View tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}