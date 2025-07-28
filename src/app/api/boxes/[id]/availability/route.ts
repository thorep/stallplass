import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { updateBoxAvailability } from '@/services/box-service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      user.id,
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
}