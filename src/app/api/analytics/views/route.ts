import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';

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
      const totalViews = await prisma.page_views.count({
        where: {
          entityType: entityType,
          entityId: entityId,
          createdAt: {
            gte: dateFrom,
          },
        },
      });

      // Get individual views for grouping by day
      const viewsData = await prisma.page_views.findMany({
        where: {
          entityType: entityType,
          entityId: entityId,
          createdAt: {
            gte: dateFrom,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group views by day (client-side aggregation)
      const viewsByDayMap = new Map<string, number>();
      viewsData.forEach(view => {
        const date = view.createdAt.toISOString().split('T')[0];
        viewsByDayMap.set(date, (viewsByDayMap.get(date) || 0) + 1);
      });

      const viewsByDay = Array.from(viewsByDayMap.entries()).map(([date, views]) => ({
        date,
        views,
      })).sort((a, b) => a.date.localeCompare(b.date));

      analytics = {
        entityId,
        entityType,
        totalViews,
        viewsByDay,
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
          boxes: {
            select: {
              id: true,
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
        },
      });

      const stableIds = stables.map(s => s.id);
      const boxIds = stables.flatMap(s => s.boxes.map(b => b.id));
      const serviceIds = services.map(s => s.id);

      // Get view counts
      const stableViews = stableIds.length > 0 ? await prisma.page_views.count({
        where: {
          entityType: 'STABLE',
          entityId: {
            in: stableIds,
          },
          createdAt: {
            gte: dateFrom,
          },
        },
      }) : 0;

      const boxViews = boxIds.length > 0 ? await prisma.page_views.count({
        where: {
          entityType: 'BOX',
          entityId: {
            in: boxIds,
          },
          createdAt: {
            gte: dateFrom,
          },
        },
      }) : 0;

      const serviceViews = serviceIds.length > 0 ? await prisma.page_views.count({
        where: {
          entityType: 'SERVICE',
          entityId: {
            in: serviceIds,
          },
          createdAt: {
            gte: dateFrom,
          },
        },
      }) : 0;

      // Get detailed views by stable
      const stableViewsDetailed = await Promise.all(
        stables.map(async (stable) => {
          const views = await prisma.page_views.count({
            where: {
              entityType: 'STABLE',
              entityId: stable.id,
              createdAt: {
                gte: dateFrom,
              },
            },
          });

          return {
            stableId: stable.id,
            stableName: stable.name,
            views,
          };
        })
      );

      // Get detailed views by box
      const boxViewsDetailed = await Promise.all(
        stables.flatMap(stable => 
          stable.boxes.map(async (box) => {
            const views = await prisma.page_views.count({
              where: {
                entityType: 'BOX',
                entityId: box.id,
                createdAt: {
                  gte: dateFrom,
                },
              },
            });

            const boxInfo = await prisma.boxes.findUnique({
              where: {
                id: box.id,
              },
              select: {
                name: true,
                stables: {
                  select: {
                    name: true,
                  },
                },
              },
            });

            return {
              boxId: box.id,
              boxName: boxInfo?.name || 'Unknown',
              stableName: boxInfo?.stables.name || 'Unknown',
              views,
            };
          })
        )
      );

      // Get detailed views by service
      const serviceViewsDetailed = await Promise.all(
        services.map(async (service) => {
          const views = await prisma.page_views.count({
            where: {
              entityType: 'SERVICE',
              entityId: service.id,
              createdAt: {
                gte: dateFrom,
              },
            },
          });

          const serviceInfo = await prisma.services.findUnique({
            where: {
              id: service.id,
            },
            select: {
              title: true,
              serviceType: true,
            },
          });

          return {
            serviceId: service.id,
            serviceName: serviceInfo?.title || 'Unknown',
            serviceType: serviceInfo?.serviceType || 'unknown',
            views,
          };
        })
      );

      analytics = {
        summary: {
          totalStableViews: stableViews,
          totalBoxViews: boxViews,
          totalServiceViews: serviceViews,
          totalViews: stableViews + boxViews + serviceViews,
        },
        stables: stableViewsDetailed,
        boxes: await Promise.all(boxViewsDetailed),
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