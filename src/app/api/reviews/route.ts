import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest} from '@/lib/supabase-auth-middleware'
import { createReview, getReviews } from '@/services/review-service'
import { Database } from '@/types/supabase'

type RevieweeType = Database['public']['Enums']['reviewee_type']

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
      rental_id: rentalId,
      reviewer_id: decodedToken.uid,
      reviewee_id: revieweeId,
      reviewee_type: revieweeType,
      stable_id: stableId,
      rating,
      title,
      comment,
      communication_rating: communicationRating,
      cleanliness_rating: cleanlinessRating,
      facilities_rating: facilitiesRating,
      reliability_rating: reliabilityRating
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
      stable_id?: string;
      reviewee_id?: string;
      reviewee_type?: RevieweeType;
    } = {}
    
    if (stableId) {
      filters.stable_id = stableId
    }
    
    if (revieweeId) {
      filters.reviewee_id = revieweeId
    }
    
    const validRevieweeTypes: RevieweeType[] = ['RENTER', 'STABLE_OWNER']
    if (revieweeType && validRevieweeTypes.includes(revieweeType)) {
      filters.reviewee_type = revieweeType
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