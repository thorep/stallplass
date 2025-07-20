'use client'

import { ReviewDisplay } from './ReviewDisplay'
import { Tables } from '@/types/supabase'

// Extend Supabase Review type with relations for UI
type ReviewWithRelations = Tables<'reviews'> & {
  reviewer: {
    name: string | null
    avatar?: string | null
  }
  reviewee: {
    name: string | null
  }
  stable: {
    name: string
  }
}

interface ReviewListProps {
  reviews: ReviewWithRelations[]
  showStableName?: boolean
  showRevieweeName?: boolean
  emptyMessage?: string
  title?: string
}

export function ReviewList({
  reviews,
  showStableName = false,
  showRevieweeName = false,
  emptyMessage = 'Ingen anmeldelser ennå.',
  title
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        {title && (
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        )}
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {title && (
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      )}
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewDisplay
            key={review.id}
            review={review}
            showStableName={showStableName}
            showRevieweeName={showRevieweeName}
          />
        ))}
      </div>
    </div>
  )
}