import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { createClient } from '@/utils/supabase/server';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Users can only fetch their own buys
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const horseBuys = await prisma.horse_buys.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { breed: true, discipline: true },
    });
    return NextResponse.json({ data: horseBuys });
  } catch (error) {
    console.error('Error fetching user horse buys:', error);
    const posthog = getPostHogServer();
    posthog.captureException(error, user?.id, {
      context: 'horse_buys_by_user',
      userId
    });
    return NextResponse.json({ error: 'Failed to fetch horse buys' }, { status: 500 });
  }
}
