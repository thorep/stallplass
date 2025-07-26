import { prisma } from './prisma'
import type { reviews, Prisma, RevieweeType } from '@/generated/prisma'

export type Review = reviews
export type CreateReviewData = Prisma.reviewsUncheckedCreateInput
export type UpdateReviewData = Prisma.reviewsUpdateInput
export type { RevieweeType }

export interface ReviewFilter {
  stableId?: string
  revieweeId?: string
  revieweeType?: RevieweeType
  isPublic?: boolean
}

export async function createReview(data: CreateReviewData) {
  try {
    return await prisma.reviews.create({
      data
    })
  } catch (error) {
    throw new Error(`Could not create review: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function updateReview(
  reviewId: string, 
  data: UpdateReviewData, 
  userId: string
) {
  try {
    // First check if review exists and user has permission
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: reviewId,
        reviewerId: userId
      }
    })

    if (!existingReview) {
      throw new Error('Review not found or you do not have permission to update')
    }

    // Update the review
    return await prisma.reviews.update({
      where: { id: reviewId },
      data
    })
  } catch (error) {
    throw new Error(`Could not update review: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getReviewById(reviewId: string) {
  try {
    return await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        users_reviews_reviewerIdTousers: true,
        users_reviews_revieweeIdTousers: true,
        stables: true
      }
    })
  } catch (error) {
    throw new Error(`Could not fetch review: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getReviews(filter: ReviewFilter = {}) {
  try {
    const where: Record<string, any> = {}
    
    if (filter.stableId) {
      where.stableId = filter.stableId
    }
    
    if (filter.revieweeId) {
      where.revieweeId = filter.revieweeId
    }
    
    if (filter.revieweeType) {
      where.revieweeType = filter.revieweeType
    }
    
    if (filter.isPublic !== undefined) {
      where.isPublic = filter.isPublic
    }

    return await prisma.reviews.findMany({
      where,
      include: {
        users_reviews_reviewerIdTousers: true,
        users_reviews_revieweeIdTousers: true,
        stables: true
      }
    })
  } catch (error) {
    throw new Error(`Could not fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteReview(reviewId: string, userId: string) {
  try {
    // First check if review exists and user has permission
    const review = await prisma.reviews.findFirst({
      where: {
        id: reviewId,
        reviewerId: userId
      }
    })

    if (!review) {
      throw new Error('Review not found or you do not have permission to delete')
    }

    await prisma.reviews.delete({
      where: { id: reviewId }
    })

    return { success: true }
  } catch (error) {
    throw new Error(`Could not delete review: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getReviewStats(stableId: string) {
  try {
    const reviews = await prisma.reviews.findMany({
      where: {
        stableId,
        revieweeType: 'STABLE_OWNER',
        isPublic: true
      },
      select: {
        rating: true
      }
    })

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
  } catch (error) {
    throw new Error(`Could not fetch review stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getUserReviewableRentals(userId: string) {
  try {
    // First get stable IDs owned by this user
    const ownedStables = await prisma.stables.findMany({
      where: { ownerId: userId },
      select: { id: true }
    })
    
    const ownedStableIds = ownedStables.map(s => s.id)

    // Get rentals where user is either the rider or stable owner
    const whereCondition = ownedStableIds.length > 0 
      ? {
          status: 'ACTIVE' as const,
          OR: [
            { riderId: userId },
            { stableId: { in: ownedStableIds } }
          ]
        }
      : {
          status: 'ACTIVE' as const,
          riderId: userId
        }
    
    return await prisma.rentals.findMany({
      where: whereCondition,
      include: {
        stables: true,
        boxes: true,
        users: true,
        reviews: true
      }
    })
  } catch (error) {
    throw new Error(`Could not fetch reviewable rentals: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function hasUserReviewedRental(userId: string, rentalId: string) {
  try {
    const review = await prisma.reviews.findFirst({
      where: {
        reviewerId: userId,
        rentalId: rentalId
      },
      select: { id: true }
    })

    return !!review
  } catch (error) {
    throw new Error(`Could not check review status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Legacy exports for backward compatibility
export const opprettAnmeldelse = createReview
export const oppdaterAnmeldelse = updateReview
export const hentAnmeldelser = getReviews
export const slettAnmeldelse = deleteReview