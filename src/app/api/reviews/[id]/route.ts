import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest} from '@/lib/supabase-auth-middleware'
import { updateReview, deleteReview, getReviewById } from '@/services/review-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const review = await getReviewById(id)
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      rating,
      title,
      comment,
      communicationRating,
      cleanlinessRating,
      facilitiesRating,
      reliabilityRating
    } = body

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const { id } = await params
    const review = await updateReview(id, {
      rating,
      title,
      comment,
      communicationRating,
      cleanlinessRating,
      facilitiesRating,
      reliabilityRating
    }, decodedToken.uid)

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteReview(id, decodedToken.uid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete review' },
      { status: 500 }
    )
  }
}