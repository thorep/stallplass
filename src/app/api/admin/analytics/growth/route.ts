import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';

type TimeRange = 'hours' | 'days' | 'months' | 'years';

interface GrowthMetrics {
  profiles: { timestamp: string; count: number }[];
  stables: { timestamp: string; count: number }[];
  boxes: { timestamp: string; count: number }[];
  partLoanHorses: { timestamp: string; count: number }[];
  horses: { timestamp: string; count: number }[];
  horseSales: { timestamp: string; count: number }[];
  horseBuys: { timestamp: string; count: number }[];
  services: { timestamp: string; count: number }[];
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {

    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('range') || 'days') as TimeRange;

    const metrics = await getGrowthMetrics(timeRange);

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error('Growth analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch growth analytics' },
      { status: 500 }
    );
  }
}

async function getGrowthMetrics(timeRange: TimeRange): Promise<GrowthMetrics> {
  const { timeFormat, interval, limit } = getTimeConfig(timeRange);
  
  // Query each table for growth metrics
  const [profiles, stables, boxes, partLoanHorses, horses, horseSales, horseBuys, services] = await Promise.all([
    getMetricsForTable('profiles', timeFormat, interval, limit),
    getMetricsForTable('stables', timeFormat, interval, limit),
    getMetricsForTable('boxes', timeFormat, interval, limit),
    getMetricsForTable('part_loan_horses', timeFormat, interval, limit),
    getMetricsForTable('horses', timeFormat, interval, limit),
    getMetricsForTable('horse_sales', timeFormat, interval, limit),
    getMetricsForTable('horse_buys', timeFormat, interval, limit),
    getMetricsForTable('services', timeFormat, interval, limit),
  ]);

  return {
    profiles,
    stables,
    boxes,
    partLoanHorses,
    horses,
    horseSales,
    horseBuys,
    services,
  };
}

function getTimeConfig(timeRange: TimeRange) {
  switch (timeRange) {
    case 'hours':
      return {
        timeFormat: 'YYYY-MM-DD HH24:00:00',
        interval: '1 hour',
        limit: 24
      };
    case 'days':
      return {
        timeFormat: 'YYYY-MM-DD',
        interval: '1 day',
        limit: 30
      };
    case 'months':
      return {
        timeFormat: 'YYYY-MM',
        interval: '1 month',
        limit: 12
      };
    case 'years':
      return {
        timeFormat: 'YYYY',
        interval: '1 year',
        limit: 5
      };
    default:
      return {
        timeFormat: 'YYYY-MM-DD',
        interval: '1 day',
        limit: 30
      };
  }
}

async function getMetricsForTable(
  tableName: string,
  timeFormat: string,
  interval: string,
  limit: number
): Promise<{ timestamp: string; count: number }[]> {
  
  // Use Prisma directly to bypass RLS issues
  const results: { timestamp: string; count: number }[] = [];
  const now = new Date();
  
  for (let i = limit - 1; i >= 0; i--) {
    let periodStart: Date;
    let periodEnd: Date;
    let timestamp: string;
    
    if (timeFormat === 'YYYY-MM-DD HH24:00:00') {
      // Hours
      periodStart = new Date(now);
      periodStart.setHours(now.getHours() - i, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setHours(periodStart.getHours() + 1, 0, 0, 0);
      timestamp = periodStart.toISOString().substring(0, 13) + ':00:00';
    } else if (timeFormat === 'YYYY-MM-DD') {
      // Days
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - i);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 1);
      timestamp = periodStart.toISOString().substring(0, 10);
    } else {
      // For months and years, just use total count for now
      periodStart = new Date(0); // Beginning of time
      periodEnd = now;
      timestamp = now.toISOString().substring(0, 10);
    }

    try {
      let count = 0;
      
      // Handle each table separately to avoid TypeScript union type issues
      switch (tableName) {
        case 'profiles':
          count = await prisma.profiles.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'stables':
          count = await prisma.stables.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'boxes':
          count = await prisma.boxes.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'part_loan_horses':
          count = await prisma.part_loan_horses.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'horses':
          count = await prisma.horses.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'horse_sales':
          count = await prisma.horse_sales.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'horse_buys':
          count = await prisma.horse_buys.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        case 'services':
          count = await prisma.services.count({
            where: {
              createdAt: {
                gte: periodStart,
                lt: periodEnd,
              },
            },
          });
          break;
        default:
          console.error(`Unknown table: ${tableName}`);
      }

      results.push({
        timestamp,
        count: count || 0
      });
    } catch (error) {
      console.error(`Exception querying ${tableName}:`, error);
      results.push({
        timestamp,
        count: 0
      });
    }
  }

  return results;
}
