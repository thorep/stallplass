import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';

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

    const validEntityTypes: EntityType[] = ['STABLE', 'BOX'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Create the page view record
    const pageView = await prisma.page_views.create({
      data: {
        entityType: entityType,
        entityId: entityId,
        viewerId: viewerId || null,
        ipAddress: ipAddress,
        userAgent: userAgent,
        referrer,
      }
    });

    return NextResponse.json(pageView, { status: 201 });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}