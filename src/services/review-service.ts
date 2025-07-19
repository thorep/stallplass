import { prisma } from '@/lib/prisma'
import { RevieweeType } from '@prisma/client'

export interface CreateReviewData {
  rentalId: string
  reviewerId: string
  revieweeId: string
  revieweeType: RevieweeType
  stableId: string
  rating: number
  title?: string
  comment?: string
  communicationRating?: number
  cleanlinessRating?: number
  facilitiesRating?: number
  reliabilityRating?: number
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  comment?: string
  communicationRating?: number
  cleanlinessRating?: number
  facilitiesRating?: number
  reliabilityRating?: number
}

export interface ReviewFilters {
  stableId?: string
  revieweeId?: string
  revieweeType?: RevieweeType
  isPublic?: boolean
}

export async function createReview(data: CreateReviewData) {
  // Check if rental exists and user has permission to review
  const rental = await prisma.rental.findFirst({
    where: {
      id: data.rentalId,
      OR: [
        { riderId: data.reviewerId },
        { 
          stable: {
            ownerId: data.reviewerId
          }
        }
      ]
    },
    include: {
      stable: true,
      rider: true
    }
  })

  if (!rental) {
    throw new Error('Rental not found or you do not have permission to review')
  }

  // Validate reviewee based on type
  if (data.revieweeType === 'STABLE_OWNER' && data.revieweeId !== rental.stable.ownerId) {
    throw new Error('Invalid reviewee for stable owner review')
  }
  
  if (data.revieweeType === 'RENTER' && data.revieweeId !== rental.riderId) {
    throw new Error('Invalid reviewee for renter review')
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: {
      rentalId_reviewerId_revieweeType: {
        rentalId: data.rentalId,
        reviewerId: data.reviewerId,
        revieweeType: data.revieweeType
      }
    }
  })

  if (existingReview) {
    throw new Error('Review already exists for this rental')
  }

  // Create the review
  const review = await prisma.review.create({
    data,
    include: {
      reviewer: {
        select: {
          name: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          name: true
        }
      },
      stable: {
        select: {
          name: true
        }
      }
    }
  })

  // Update stable aggregate rating if this is a stable review
  if (data.revieweeType === 'STABLE_OWNER') {
    await updateStableAggregateRating(data.stableId)
  }

  return review
}

export async function updateReview(
  reviewId: string, 
  data: UpdateReviewData, 
  userId: string
) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId: userId
    }
  })

  if (!review) {
    throw new Error('Review not found or you do not have permission to update')
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      reviewer: {
        select: {
          name: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          name: true
        }
      },
      stable: {
        select: {
          name: true
        }
      }
    }
  })

  // Update stable aggregate rating if this is a stable review
  if (review.revieweeType === 'STABLE_OWNER') {
    await updateStableAggregateRating(review.stableId)
  }

  return updatedReview
}

export async function getReviews(filters: ReviewFilters = {}) {
  const where: {
    isPublic?: boolean;
    stableId?: string;
    revieweeId?: string;
    revieweeType?: RevieweeType;
  } = {
    isPublic: filters.isPublic ?? true
  }

  if (filters.stableId) {
    where.stableId = filters.stableId
  }

  if (filters.revieweeId) {
    where.revieweeId = filters.revieweeId
  }

  if (filters.revieweeType) {
    where.revieweeType = filters.revieweeType
  }

  return await prisma.review.findMany({
    where,
    include: {
      reviewer: {
        select: {
          name: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          name: true
        }
      },
      stable: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getReviewById(reviewId: string) {
  return await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: {
        select: {
          name: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          name: true
        }
      },
      stable: {
        select: {
          name: true
        }
      },
      rental: {
        select: {
          startDate: true,
          endDate: true,
          status: true
        }
      }
    }
  })
}

export async function getUserReviewableRentals(userId: string) {
  // Get rentals where user can write reviews (as renter or stable owner)
  const rentals = await prisma.rental.findMany({
    where: {
      OR: [
        { riderId: userId },
        { 
          stable: {
            ownerId: userId
          }
        }
      ]
    },
    include: {
      stable: {
        include: {
          owner: {
            select: {
              firebaseId: true,
              name: true
            }
          }
        }
      },
      rider: {
        select: {
          firebaseId: true,
          name: true
        }
      },
      box: {
        select: {
          name: true
        }
      },
      reviews: true
    }
  })

  // Add review status for each rental
  return rentals.map(rental => {
    const isRenter = rental.riderId === userId
    const isStableOwner = rental.stable.ownerId === userId

    let canReviewStable = false
    let canReviewRenter = false
    let hasReviewedStable = false
    let hasReviewedRenter = false

    if (isRenter) {
      canReviewStable = true
      hasReviewedStable = rental.reviews.some(r => 
        r.reviewerId === userId && r.revieweeType === 'STABLE_OWNER'
      )
    }

    if (isStableOwner) {
      canReviewRenter = true
      hasReviewedRenter = rental.reviews.some(r => 
        r.reviewerId === userId && r.revieweeType === 'RENTER'
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
  const stableReviews = await prisma.review.findMany({
    where: {
      stableId,
      revieweeType: 'STABLE_OWNER',
      isPublic: true
    }
  })

  const reviewCount = stableReviews.length
  const averageRating = reviewCount > 0 
    ? stableReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : 0

  await prisma.stable.update({
    where: { id: stableId },
    data: {
      rating: averageRating,
      reviewCount
    }
  })

  return { rating: averageRating, reviewCount }
}

export async function deleteReview(reviewId: string, userId: string) {
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      reviewerId: userId
    }
  })

  if (!review) {
    throw new Error('Review not found or you do not have permission to delete')
  }

  await prisma.review.delete({
    where: { id: reviewId }
  })

  // Update stable aggregate rating if this was a stable review
  if (review.revieweeType === 'STABLE_OWNER') {
    await updateStableAggregateRating(review.stableId)
  }

  return { success: true }
}