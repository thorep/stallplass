'use client'

import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { Tables } from '@/types/supabase'
import Image from 'next/image'

// Extend Supabase Review type with relations for UI
type ReviewWithRelations = Tables<'anmeldelser'> & {
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

interface ReviewDisplayProps {
  review: ReviewWithRelations
  showStableName?: boolean
  showRevieweeName?: boolean
}

export function ReviewDisplay({ 
  review, 
  showStableName = false, 
  showRevieweeName = false 
}: ReviewDisplayProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIcon className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: nb
    })
  }

  const isStableReview = review.anmeldt_type === 'STABLE_OWNER'

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {review.reviewer.avatar ? (
            <Image
              src={review.reviewer.avatar}
              alt={review.reviewer.name || 'Anmelder'}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {review.reviewer.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900">
              {review.reviewer.name || 'Anonym bruker'}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(review.created_at || '')}
            </p>
          </div>
        </div>
        <div className="text-right">
          {renderStars(review.rating)}
          <p className="text-xs text-gray-500 mt-1">
            {isStableReview ? 'Anmeldelse av stall' : 'Anmeldelse av leietaker'}
          </p>
        </div>
      </div>

      {showStableName && (
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Stall:</span> {review.stable.name}
        </p>
      )}

      {showRevieweeName && (
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">
            {isStableReview ? 'Anmeldt stall:' : 'Anmeldt leietaker:'}
          </span> {review.reviewee.name}
        </p>
      )}

      {review.title && (
        <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
      )}

      {review.comment && (
        <p className="text-gray-700 mb-4">{review.comment}</p>
      )}

      {/* Detailed ratings */}
      {(review.kommunikasjon_vurdering || review.renslighet_vurdering || 
        review.fasiliteter_vurdering || review.palitelighet_vurdering) && (
        <div className="border-t pt-4">
          <h6 className="text-sm font-medium text-gray-700 mb-2">Detaljerte vurderinger:</h6>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {review.kommunikasjon_vurdering && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Kommunikasjon:</span>
                {renderStars(review.kommunikasjon_vurdering)}
              </div>
            )}
            {review.renslighet_vurdering && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Renslighet:</span>
                {renderStars(review.renslighet_vurdering)}
              </div>
            )}
            {review.fasiliteter_vurdering && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fasiliteter:</span>
                {renderStars(review.fasiliteter_vurdering)}
              </div>
            )}
            {review.palitelighet_vurdering && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pålitelighet:</span>
                {renderStars(review.palitelighet_vurdering)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}