import { NextRequest, NextResponse } from 'next/server';
import { restoreService } from '@/services/marketplace-service';
import { withAuth } from '@/lib/supabase-auth-middleware';

export const POST = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    await restoreService(id, profileId);
    return NextResponse.json({ message: 'Service restored successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore service' },
      { status: 500 }
    );
  }
});