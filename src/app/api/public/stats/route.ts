import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  try {
    // Get count of active stables (stables that are not deleted)
    const activeStables = await prisma.stables.count({
      where: {
        deletedAt: null
      }
    });

    // Get count of registered users (profiles)
    const registeredUsers = await prisma.profiles.count();

    // Get count of active boxes (boxes that are not deleted)
    const activeBoxes = await prisma.boxes.count({
      where: {
        deletedAt: null
      }
    });

    return NextResponse.json({
      activeStables,
      registeredUsers,
      activeBoxes
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    try { captureApiError({ error, context: 'public_stats_get', route: '/api/public/stats', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
