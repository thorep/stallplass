import { supabase } from '@/lib/supabase'
import { Tables, TablesInsert, TablesUpdate, Database } from '@/types/supabase'

export type Review = Tables<'reviews'>
export type CreateReviewData = TablesInsert<'reviews'>
export type UpdateReviewData = TablesUpdate<'reviews'>
export type RevieweeType = Database['public']['Enums']['reviewee_type']

export interface ReviewFilter {
  stable_id?: string
  reviewee_id?: string
  reviewee_type?: RevieweeType
  is_public?: boolean
}

export async function createReview(data: CreateReviewData) {
  const { data: review, error } = await supabase
    .from('reviews')
    .insert(data)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Could not create review: ${error.message}`)
  }

  return review
}

export async function updateReview(
  reviewId: string, 
  data: UpdateReviewData, 
  userId: string
) {
  // First check if review exists and user has permission
  const { data: existingReview, error: findError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('reviewer_id', userId)
    .single()

  if (findError || !existingReview) {
    throw new Error('Review not found or you do not have permission to update')
  }

  // Update the review
  const { data: updatedReview, error: updateError } = await supabase
    .from('reviews')
    .update(data)
    .eq('id', reviewId)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(`Could not update review: ${updateError.message}`)
  }

  return updatedReview
}

export async function getReviewById(reviewId: string) {
  const { data: review, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(*),
      reviewee:users!reviews_reviewee_id_fkey(*),
      stable:stables(*)
    `)
    .eq('id', reviewId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    throw new Error(`Could not fetch review: ${error.message}`)
  }

  return review
}

export async function getReviews(filter: ReviewFilter = {}) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(*),
      reviewee:users!reviews_reviewee_id_fkey(*),
      stable:stables(*)
    `)

  if (filter.stable_id) {
    query = query.eq('stable_id', filter.stable_id)
  }

  if (filter.reviewee_id) {
    query = query.eq('reviewee_id', filter.reviewee_id)
  }

  if (filter.reviewee_type) {
    query = query.eq('reviewee_type', filter.reviewee_type)
  }

  if (filter.is_public !== undefined) {
    query = query.eq('is_public', filter.is_public)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Could not fetch reviews: ${error.message}`)
  }

  return data || []
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
    throw new Error(`Could not delete review: ${deleteError.message}`)
  }

  return { success: true }
}

export async function getReviewStats(stableId: string) {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('stable_id', stableId)
    .eq('reviewee_type', 'STABLE_OWNER')
    .eq('is_public', true)

  if (error) {
    throw new Error(`Could not fetch review stats: ${error.message}`)
  }

  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    }
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / reviews.length

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length
  }
}

export async function getUserReviewableRentals(userId: string) {
  // First get stable IDs owned by this user
  const { data: ownedStables } = await supabase
    .from('stables')
    .select('id')
    .eq('owner_id', userId);
  
  const ownedStableIds = ownedStables?.map(s => s.id) || [];

  // Get rentals where user is either the rider or stable owner
  let query = supabase
    .from('rentals')
    .select(`
      *,
      stable:stables(*),
      box:boxes(*),
      rider:users!rentals_rider_id_fkey(*),
      reviews(*)
    `)
    .eq('status', 'ACTIVE');
  
  // Apply OR condition for rider or stable owner
  if (ownedStableIds.length > 0) {
    query = query.or(`rider_id.eq.${userId},stable_id.in.(${ownedStableIds.join(',')})`);
  } else {
    query = query.eq('rider_id', userId);
  }
  
  const { data: rentals, error } = await query;

  if (error) {
    throw new Error(`Could not fetch reviewable rentals: ${error.message}`)
  }

  return rentals || []
}

export async function hasUserReviewedRental(userId: string, rentalId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', userId)
    .eq('rental_id', rentalId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    throw new Error(`Could not check review status: ${error.message}`)
  }

  return !!data
}

// Legacy exports for backward compatibility
export const opprettAnmeldelse = createReview
export const oppdaterAnmeldelse = updateReview
export const hentAnmeldelser = getReviews
export const slettAnmeldelse = deleteReview