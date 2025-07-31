import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const entityType = searchParams.get('entityType') as EntityType;
    const entityId = searchParams.get('entityId');

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId is required' },
        { status: 400 }
      );
    }

    let analytics;

    if (entityId && entityType) {
      // Get view count for a specific entity
      let totalViews = 0;

      if (entityType === 'STABLE') {
        const stable = await prisma.stables.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = stable?.viewCount || 0;
      } else if (entityType === 'BOX') {
        const box = await prisma.boxes.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = box?.viewCount || 0;
      } else if (entityType === 'SERVICE') {
        const service = await prisma.services.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = service?.viewCount || 0;
      }

      analytics = {
        entityId,
        entityType,
        totalViews,
        // We no longer have daily breakdown data since we're using counters
        viewsByDay: [],
      };
    } else {
      // Get aggregated views for all owner's entities
      const stables = await prisma.stables.findMany({
        where: {
          ownerId: ownerId,
        },
        select: {
          id: true,
          name: true,
          viewCount: true,
          boxes: {
            select: {
              id: true,
              name: true,
              viewCount: true,
            },
          },
        },
      });

      const services = await prisma.services.findMany({
        where: {
          userId: ownerId,
        },
        select: {
          id: true,
          title: true,
          serviceType: true,
          viewCount: true,
        },
      });

      // Calculate totals
      const totalStableViews = stables.reduce((sum, stable) => sum + stable.viewCount, 0);
      const totalBoxViews = stables.reduce((sum, stable) => 
        sum + stable.boxes.reduce((boxSum, box) => boxSum + box.viewCount, 0), 0
      );
      const totalServiceViews = services.reduce((sum, service) => sum + service.viewCount, 0);

      // Prepare detailed views by stable
      const stableViewsDetailed = stables.map(stable => ({
        stableId: stable.id,
        stableName: stable.name,
        views: stable.viewCount,
      }));

      // Prepare detailed views by box
      const boxViewsDetailed = stables.flatMap(stable =>
        stable.boxes.map(box => ({
          boxId: box.id,
          boxName: box.name,
          stableName: stable.name,
          views: box.viewCount,
        }))
      );

      // Prepare detailed views by service
      const serviceViewsDetailed = services.map(service => ({
        serviceId: service.id,
        serviceName: service.title,
        serviceType: service.serviceType,
        views: service.viewCount,
      }));

      analytics = {
        summary: {
          totalStableViews,
          totalBoxViews,
          totalServiceViews,
          totalViews: totalStableViews + totalBoxViews + totalServiceViews,
        },
        stables: stableViewsDetailed,
        boxes: boxViewsDetailed,
        services: serviceViewsDetailed,
      };
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}