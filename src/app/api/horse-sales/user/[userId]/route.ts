import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
// Removed unused PostHog import
import { captureApiError } from '@/lib/posthog-capture';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only fetch their own horse sales
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const horseSales = await prisma.horse_sales.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        breed: true,
        discipline: true,
        counties: true,
        municipalities: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: horseSales });
  } catch (error) {
    console.error('Error fetching user horse sales:', error);
    const { userId } = await params;
    try { captureApiError({ error, context: 'horse_sales_by_user_get', route: '/api/horse-sales/user/[userId]', method: 'GET', userId }); } catch {}
    return NextResponse.json({ error: 'Failed to fetch horse sales' }, { status: 500 });
  }
}
