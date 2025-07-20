import { supabase } from '@/lib/supabase'
import { RevieweeType } from '@/lib/supabase'

export interface CreateReviewData {
  rental_id: string
  reviewer_id: string
  reviewee_id: string
  reviewee_type: RevieweeType
  stable_id: string
  rating: number
  title?: string
  comment?: string
  communication_rating?: number
  cleanliness_rating?: number
  facilities_rating?: number
  reliability_rating?: number
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  comment?: string
  communication_rating?: number
  cleanliness_rating?: number
  facilities_rating?: number
  reliability_rating?: number
}

export interface ReviewFilters {
  stable_id?: string
  reviewee_id?: string
  reviewee_type?: RevieweeType
  is_public?: boolean
}

export async function createReview(data: CreateReviewData) {
  // Check if rental exists and user has permission to review
  const { data: rental, error: rentalError } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:stables(*),
      rider:users!rentals_rider_id_fkey(firebase_id, name)
    `)
    .eq('id', data.rental_id)
    .or(`rider_id.eq.${data.reviewer_id},stable.owner_id.eq.${data.reviewer_id}`)
    .single()

  if (rentalError || !rental) {
    throw new Error('Rental not found or you do not have permission to review')
  }

  // Validate reviewee based on type
  if (data.reviewee_type === 'STABLE_OWNER' && data.reviewee_id !== rental.stable.owner_id) {
    throw new Error('Invalid reviewee for stable owner review')
  }
  
  if (data.reviewee_type === 'RENTER' && data.reviewee_id !== rental.rider_id) {
    throw new Error('Invalid reviewee for renter review')
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('rental_id', data.rental_id)
    .eq('reviewer_id', data.reviewer_id)
    .eq('reviewee_type', data.reviewee_type)
    .single()

  if (existingReview) {
    throw new Error('Review already exists for this rental')
  }

  // Create the review
  const { data: newReview, error: createError } = await supabase
    .from('reviews')
    .insert([data])
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(name, avatar),
      reviewee:users!reviews_reviewee_id_fkey(name),
      stable:stables(name)
    `)
    .single()

  if (createError) {
    throw new Error(`Failed to create review: ${createError.message}`)
  }

  // Update stable aggregate rating if this is a stable review
  if (data.reviewee_type === 'STABLE_OWNER') {
    await updateStableAggregateRating(data.stable_id)
  }

  return newReview
}

export async function updateReview(
  reviewId: string, 
  data: UpdateReviewData, 
  userId: string
) {
  // First check if review exists and user has permission
  const { data: review, error: findError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('reviewer_id', userId)
    .single()

  if (findError || !review) {
    throw new Error('Review not found or you do not have permission to update')
  }

  // Update the review
  const { data: updatedReview, error: updateError } = await supabase
    .from('reviews')
    .update(data)
    .eq('id', reviewId)
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(name, avatar),
      reviewee:users!reviews_reviewee_id_fkey(name),
      stable:stables(name)
    `)
    .single()

  if (updateError) {
    throw new Error(`Failed to update review: ${updateError.message}`)
  }

  // Update stable aggregate rating if this is a stable review
  if (review.reviewee_type === 'STABLE_OWNER') {
    await updateStableAggregateRating(review.stable_id)
  }

  return updatedReview
}

export async function getReviews(filters: ReviewFilters = {}) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(name, avatar),
      reviewee:users!reviews_reviewee_id_fkey(name),
      stable:stables(name)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  const isPublic = filters.is_public ?? true
  query = query.eq('is_public', isPublic)

  if (filters.stable_id) {
    query = query.eq('stable_id', filters.stable_id)
  }

  if (filters.reviewee_id) {
    query = query.eq('reviewee_id', filters.reviewee_id)
  }

  if (filters.reviewee_type) {
    query = query.eq('reviewee_type', filters.reviewee_type)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`)
  }

  return data || []
}

export async function getReviewById(reviewId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(name, avatar),
      reviewee:users!reviews_reviewee_id_fkey(name),
      stable:stables(name),
      rental:rentals(start_date, end_date, status)
    `)
    .eq('id', reviewId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getUserReviewableRentals(userId: string) {
  // Get rentals where user can write reviews (as renter or stable owner)
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:stables(
        *,
        owner:users!stables_owner_id_fkey(firebase_id, name)
      ),
      rider:users!rentals_rider_id_fkey(firebase_id, name),
      box:boxes(name),
      reviews(*)
    `)
    .or(`rider_id.eq.${userId},stable.owner_id.eq.${userId}`)

  if (error) {
    throw new Error(`Failed to fetch reviewable rentals: ${error.message}`)
  }

  if (!rentals) {
    return []
  }

  // Add review status for each rental
  return rentals.map(rental => {
    const isRenter = rental.rider_id === userId
    const isStableOwner = rental.stable.owner_id === userId

    let canReviewStable = false
    let canReviewRenter = false
    let hasReviewedStable = false
    let hasReviewedRenter = false

    if (isRenter) {
      canReviewStable = true
      hasReviewedStable = rental.reviews.some((r: any) => 
        r.reviewer_id === userId && r.reviewee_type === 'STABLE_OWNER'
      )
    }

    if (isStableOwner) {
      canReviewRenter = true
      hasReviewedRenter = rental.reviews.some((r: any) => 
        r.reviewer_id === userId && r.reviewee_type === 'RENTER'
      )
    }

    return {
      ...rental,
      canReviewStable,
      canReviewRenter,
      hasReviewedStable,
      hasReviewedRenter
    }
  })
}

export async function updateStableAggregateRating(stableId: string) {
  const { data: stableReviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('stable_id', stableId)
    .eq('reviewee_type', 'STABLE_OWNER')
    .eq('is_public', true)

  if (error) {
    throw new Error(`Failed to fetch stable reviews: ${error.message}`)
  }

  const reviewCount = stableReviews?.length || 0
  const averageRating = reviewCount > 0 
    ? stableReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : 0

  const { error: updateError } = await supabase
    .from('stables')
    .update({
      rating: averageRating,
      review_count: reviewCount
    })
    .eq('id', stableId)

  if (updateError) {
    throw new Error(`Failed to update stable rating: ${updateError.message}`)
  }

  return { rating: averageRating, reviewCount }
}

export async function deleteReview(reviewId: string, userId: string) {
  // First check if review exists and user has permission
  const { data: review, error: findError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('reviewer_id', userId)
    .single()

  if (findError || !review) {
    throw new Error('Review not found or you do not have permission to delete')
  }

  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (deleteError) {
    throw new Error(`Failed to delete review: ${deleteError.message}`)
  }

  // Update stable aggregate rating if this was a stable review
  if (review.reviewee_type === 'STABLE_OWNER') {
    await updateStableAggregateRating(review.stable_id)
  }

  return { success: true }
}