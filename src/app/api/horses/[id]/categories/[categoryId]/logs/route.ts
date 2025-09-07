import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCustomLogsByCategoryId } from '@/services/horse-log-service';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * GET /api/horses/[id]/categories/[categoryId]/logs
 * Get all logs for a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { id: horseId, categoryId } = await params;

    const logs = await getCustomLogsByCategoryId(categoryId, user.id);

    if (logs === null) {
      return NextResponse.json({ error: 'Uautorisert eller kategori finnes ikke' }, { status: 403 });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error getting category logs:', error);
    try { captureApiError({ error, context: 'category_logs_get', route: '/api/horses/[id]/categories/[categoryId]/logs', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Kunne ikke hente logger' },
      { status: 500 }
    );
  }
}