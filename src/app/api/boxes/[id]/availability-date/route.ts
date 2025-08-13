import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateBoxAvailabilityDate } from '@/services/box-service';
import { createApiLogger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const params = await context.params;
    const { id: boxId } = params;
    const { availabilityDate } = await request.json();

    // Validate availabilityDate (should be ISO string or null)
    if (availabilityDate !== null && typeof availabilityDate !== 'string') {
      return NextResponse.json(
        { error: 'availabilityDate must be a valid ISO date string or null' },
        { status: 400 }
      );
    }

    // If date is provided, validate it's in the future
    if (availabilityDate) {
      const date = new Date(availabilityDate);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (date <= now) {
        return NextResponse.json(
          { error: 'Availability date must be in the future' },
          { status: 400 }
        );
      }
    }

    const updatedBox = await updateBoxAvailabilityDate(
      boxId,
      user.id,
      availabilityDate
    );

    return NextResponse.json({ box: updatedBox });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/boxes/:id/availability-date',
      method: 'PATCH',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
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
      { error: 'Failed to update box availability date' },
      { status: 500 }
    );
  }
}