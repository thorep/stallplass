import { NextRequest, NextResponse } from 'next/server';
import { restoreBox, getBoxById } from '@/services/box-service';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export const POST = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
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
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only restore boxes in your own stables' },
        { status: 403 }
      );
    }
    
    await restoreBox(params.id);
    
    return NextResponse.json({ message: 'Box restored successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore box' },
      { status: 500 }
    );
  }
});