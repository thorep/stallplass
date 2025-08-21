import { NextRequest, NextResponse } from 'next/server';
import { restoreService } from '@/services/marketplace-service';
import { requireAuth } from '@/lib/auth';
// Removed unused PostHog import
import { captureApiError } from '@/lib/posthog-capture';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let distinctId: string | undefined;
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    distinctId = user.id;
    const { id } = await params;
    await restoreService(id, user.id);
    return NextResponse.json({ message: 'Service restored successfully' });
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'service_restore_post', route: '/api/services/[id]/restore', method: 'POST', serviceId: id, distinctId }); } catch {}
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore service' },
      { status: 500 }
    );
  }
}
