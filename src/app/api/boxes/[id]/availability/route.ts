import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { updateBoxAvailability } from '@/services/box-service';

export const PATCH = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params;
    const { id: boxId } = params;
    const { isAvailable } = await request.json();

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'isAvailable must be a boolean' },
        { status: 400 }
      );
    }

    const updatedBox = await updateBoxAvailability(
      boxId,
      profileId,
      isAvailable
    );

    return NextResponse.json({ box: updatedBox });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Box not found') {
        return NextResponse.json(
          { error: 'Box not found' },
          { status: 404 }
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You can only update your own boxes' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update box availability' },
      { status: 500 }
    );
  }
});