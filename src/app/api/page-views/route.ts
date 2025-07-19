import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntityType } from '@prisma/client';

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

    if (!Object.values(EntityType).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Create the page view record
    const pageView = await prisma.pageView.create({
      data: {
        entityType,
        entityId,
        viewerId: viewerId || null,
        ipAddress,
        userAgent,
        referrer,
      },
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