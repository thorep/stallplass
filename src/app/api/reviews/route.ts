import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest} from '@/lib/supabase-auth-middleware'
import { createReview, getReviews } from '@/services/review-service'

type RevieweeType = 'RENTER' | 'STABLE_OWNER'

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await authenticateRequest(request)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      rentalId,
      revieweeId,
      revieweeType,
      stableId,
      rating,
      title,
      comment,
      communicationRating,
      cleanlinessRating,
      facilitiesRating,
      reliabilityRating
    } = body

    // Validate required fields
    if (!rentalId || !revieweeId || !revieweeType || !stableId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate revieweeType
    const validRevieweeTypes: RevieweeType[] = ['RENTER', 'STABLE_OWNER']
    if (!validRevieweeTypes.includes(revieweeType)) {
      return NextResponse.json(
        { error: 'Invalid reviewee type' },
        { status: 400 }
      )
    }

    const review = await createReview({
      rentalId,
      reviewerId: decodedToken.uid,
      revieweeId,
      revieweeType,
      stableId,
      rating,
      title,
      comment,
      communicationRating,
      cleanlinessRating,
      facilitiesRating,
      reliabilityRating,
      updatedAt: new Date()
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create review' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stableId = searchParams.get('stableId')
    const revieweeId = searchParams.get('revieweeId')
    const revieweeType = searchParams.get('revieweeType') as RevieweeType | null

    const filters: {
      stableId?: string;
      revieweeId?: string;
      revieweeType?: RevieweeType;
    } = {}
    
    if (stableId) {
      filters.stableId = stableId
    }
    
    if (revieweeId) {
      filters.revieweeId = revieweeId
    }
    
    const validRevieweeTypes: RevieweeType[] = ['RENTER', 'STABLE_OWNER']
    if (revieweeType && validRevieweeTypes.includes(revieweeType)) {
      filters.revieweeType = revieweeType
    }

    const reviews = await getReviews(filters)
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}