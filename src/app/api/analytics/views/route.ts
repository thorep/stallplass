import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntityType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const entityType = searchParams.get('entityType') as EntityType;
    const entityId = searchParams.get('entityId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId is required' },
        { status: 400 }
      );
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    let analytics;

    if (entityId && entityType) {
      // Get views for a specific entity
      const totalViews = await prisma.pageView.count({
        where: {
          entityType,
          entityId,
          createdAt: {
            gte: dateFrom,
          },
        },
      });

      const viewsByDay = await prisma.pageView.groupBy({
        by: ['createdAt'],
        where: {
          entityType,
          entityId,
          createdAt: {
            gte: dateFrom,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      analytics = {
        entityId,
        entityType,
        totalViews,
        viewsByDay: viewsByDay.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          views: item._count.id,
        })),
      };
    } else {
      // Get aggregated views for all owner's entities
      const stableIds = await prisma.stable.findMany({
        where: { ownerId },
        select: { id: true },
      });

      const boxIds = await prisma.box.findMany({
        where: {
          stable: {
            ownerId,
          },
        },
        select: { id: true },
      });

      const stableViews = await prisma.pageView.count({
        where: {
          entityType: EntityType.STABLE,
          entityId: {
            in: stableIds.map(s => s.id),
          },
          createdAt: {
            gte: dateFrom,
          },
        },
      });

      const boxViews = await prisma.pageView.count({
        where: {
          entityType: EntityType.BOX,
          entityId: {
            in: boxIds.map(b => b.id),
          },
          createdAt: {
            gte: dateFrom,
          },
        },
      });

      // Get detailed views by stable
      const stableViewsDetailed = await Promise.all(
        stableIds.map(async (stable) => {
          const views = await prisma.pageView.count({
            where: {
              entityType: EntityType.STABLE,
              entityId: stable.id,
              createdAt: {
                gte: dateFrom,
              },
            },
          });

          const stableInfo = await prisma.stable.findUnique({
            where: { id: stable.id },
            select: { name: true },
          });

          return {
            stableId: stable.id,
            stableName: stableInfo?.name || 'Unknown',
            views,
          };
        })
      );

      // Get detailed views by box
      const boxViewsDetailed = await Promise.all(
        boxIds.map(async (box) => {
          const views = await prisma.pageView.count({
            where: {
              entityType: EntityType.BOX,
              entityId: box.id,
              createdAt: {
                gte: dateFrom,
              },
            },
          });

          const boxInfo = await prisma.box.findUnique({
            where: { id: box.id },
            select: { 
              name: true,
              stable: {
                select: { name: true },
              },
            },
          });

          return {
            boxId: box.id,
            boxName: boxInfo?.name || 'Unknown',
            stableName: boxInfo?.stable.name || 'Unknown',
            views,
          };
        })
      );

      analytics = {
        summary: {
          totalStableViews: stableViews,
          totalBoxViews: boxViews,
          totalViews: stableViews + boxViews,
        },
        stables: stableViewsDetailed,
        boxes: boxViewsDetailed,
      };
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching view analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}