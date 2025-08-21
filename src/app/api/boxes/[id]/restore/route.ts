import { NextRequest, NextResponse } from 'next/server';
import { restoreBox } from '@/services/box-service';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { captureApiError } from '@/lib/posthog-capture';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  const params = await context.params;
  try {
    // Check if box exists and user owns the stable (include archived)
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only restore boxes in your own stables' },
        { status: 403 }
      );
    }
    
    await restoreBox(params.id);
    
    return NextResponse.json({ message: 'Box restored successfully' });
  } catch (error) {
    try { captureApiError({ error, context: 'box_restore_post', route: '/api/boxes/[id]/restore', method: 'POST', boxId: params.id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore box' },
      { status: 500 }
    );
  }
}
