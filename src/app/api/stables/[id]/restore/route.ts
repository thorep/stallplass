import { NextRequest, NextResponse } from 'next/server';
import { restoreStable, getStableById } from '@/services/stable-service';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    
    // First, check if the stable exists and if the user owns it (include archived)
    const stable = await getStableById(params.id, true);
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (stable.ownerId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only restore your own stables' },
        { status: 403 }
      );
    }
    
    await restoreStable(params.id);
    return NextResponse.json({ message: 'Stable restored successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore stable' },
      { status: 500 }
    );
  }
}