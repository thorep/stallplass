import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { updateBoxAvailabilityDate } from '@/services/box-service';

export const PATCH = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
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
      profileId,
      availabilityDate
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
      { error: 'Failed to update box availability date' },
      { status: 500 }
    );
  }
});