import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import type { EntityType } from '@/generated/prisma';
import { logger } from '@/lib/logger';

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
      } else if (entityType === 'PART_LOAN_HORSE') {
        const partLoanHorse = await prisma.part_loan_horses.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = partLoanHorse?.viewCount || 0;
      } else if (entityType === 'HORSE_SALE') {
        const horseSale = await prisma.horse_sales.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = horseSale?.viewCount || 0;
      } else if (entityType === 'HORSE_BUY') {
        const horseBuy = await prisma.horse_buys.findUnique({
          where: { id: entityId },
          select: { viewCount: true }
        });
        totalViews = horseBuy?.viewCount || 0;
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
          serviceTypeId: true,
          viewCount: true,
        },
      });

      const partLoanHorses = await prisma.part_loan_horses.findMany({
        where: {
          userId: ownerId,
        },
        select: {
          id: true,
          name: true,
          viewCount: true,
        },
      });

      // Calculate totals
      const totalStableViews = stables.reduce((sum, stable) => sum + stable.viewCount, 0);
      const totalBoxViews = stables.reduce((sum, stable) => 
        sum + stable.boxes.reduce((boxSum, box) => boxSum + box.viewCount, 0), 0
      );
      const totalServiceViews = services.reduce((sum, service) => sum + service.viewCount, 0);
      const totalPartLoanHorseViews = partLoanHorses.reduce((sum, horse) => sum + horse.viewCount, 0);
      const [horseSales, horseBuys] = await Promise.all([
        prisma.horse_sales.findMany({ where: { userId: ownerId }, select: { id: true, name: true, viewCount: true } }),
        prisma.horse_buys.findMany({ where: { userId: ownerId }, select: { id: true, name: true, viewCount: true } }),
      ]);
      const totalHorseSalesViews = horseSales.reduce((sum, hs) => sum + hs.viewCount, 0);
      const totalHorseBuysViews = horseBuys.reduce((sum, hb) => sum + hb.viewCount, 0);

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
        serviceType: service.serviceTypeId,
        views: service.viewCount,
      }));

      // Prepare detailed views by part-loan horse
      const partLoanHorseViewsDetailed = partLoanHorses.map(horse => ({
        partLoanHorseId: horse.id,
        partLoanHorseName: horse.name,
        views: horse.viewCount,
      }));

      analytics = {
        summary: {
          totalStableViews,
          totalBoxViews,
          totalServiceViews,
          totalPartLoanHorseViews,
          totalViews: totalStableViews + totalBoxViews + totalServiceViews + totalPartLoanHorseViews + totalHorseSalesViews + totalHorseBuysViews,
        },
        stables: stableViewsDetailed,
        boxes: boxViewsDetailed,
        services: serviceViewsDetailed,
        partLoanHorses: partLoanHorseViewsDetailed,
        horseSales: horseSales.map(hs => ({ horseSaleId: hs.id, horseSaleName: hs.name, views: hs.viewCount })),
        horseBuys: horseBuys.map(hb => ({ horseBuyId: hb.id, horseBuyName: hb.name, views: hb.viewCount })),
      };
    }

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
