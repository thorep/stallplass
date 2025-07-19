'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { RevieweeType } from '@prisma/client'
import Button from '@/components/atoms/Button'

interface ReviewFormProps {
  revieweeType: RevieweeType
  revieweeName: string
  stableName: string
  onSubmit: (reviewData: ReviewFormData) => Promise<void>
  onCancel: () => void
  existingReview?: {
    rating: number
    title?: string | null
    comment?: string | null
    communicationRating?: number | null
    cleanlinessRating?: number | null
    facilitiesRating?: number | null
    reliabilityRating?: number | null
  }
  isSubmitting?: boolean
}

export interface ReviewFormData {
  rating: number
  title?: string
  comment?: string
  communicationRating?: number
  cleanlinessRating?: number
  facilitiesRating?: number
  reliabilityRating?: number
}

export function ReviewForm({
  revieweeType,
  revieweeName,
  stableName,
  onSubmit,
  onCancel,
  existingReview,
  isSubmitting = false
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [communicationRating, setCommunicationRating] = useState(existingReview?.communicationRating || 0)
  const [cleanlinessRating, setCleanlinessRating] = useState(existingReview?.cleanlinessRating || 0)
  const [facilitiesRating, setFacilitiesRating] = useState(existingReview?.facilitiesRating || 0)
  const [reliabilityRating, setReliabilityRating] = useState(existingReview?.reliabilityRating || 0)

  const isStableReview = revieweeType === 'STABLE_OWNER'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating < 1) {
      alert('Vennligst gi en hovedvurdering (1-5 stjerner)')
      return
    }

    const reviewData: ReviewFormData = {
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined
    }

    // Add detailed ratings if provided
    if (communicationRating > 0) reviewData.communicationRating = communicationRating
    if (isStableReview && cleanlinessRating > 0) reviewData.cleanlinessRating = cleanlinessRating
    if (isStableReview && facilitiesRating > 0) reviewData.facilitiesRating = facilitiesRating
    if (!isStableReview && reliabilityRating > 0) reviewData.reliabilityRating = reliabilityRating

    await onSubmit(reviewData)
  }

  const renderStarRating = (
    currentRating: number,
    setRating: (rating: number) => void,
    label: string
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {star <= currentRating ? (
              <StarIcon className="h-6 w-6 text-yellow-400 hover:text-yellow-500" />
            ) : (
              <StarOutlineIcon className="h-6 w-6 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {existingReview ? 'Rediger anmeldelse' : 'Skriv anmeldelse'}
        </h3>
        <p className="text-sm text-gray-600">
          {isStableReview 
            ? `Anmelder stall: ${stableName}`
            : `Anmelder leietaker: ${revieweeName}`
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Rating */}
        {renderStarRating(rating, setRating, 'Totalvurdering (påkrevd)')}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tittel (valgfritt)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sammendrag av opplevelsen..."
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Kommentar (valgfritt)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Del din opplevelse i detalj..."
            maxLength={1000}
          />
        </div>

        {/* Detailed Ratings */}
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Detaljerte vurderinger (valgfritt)</h4>
          
          {/* Communication - for both types */}
          {renderStarRating(
            communicationRating,
            setCommunicationRating,
            'Kommunikasjon'
          )}

          {isStableReview ? (
            <>
              {/* Stable-specific ratings */}
              {renderStarRating(
                cleanlinessRating,
                setCleanlinessRating,
                'Renslighet av stall og fasiliteter'
              )}
              {renderStarRating(
                facilitiesRating,
                setFacilitiesRating,
                'Kvalitet på fasiliteter'
              )}
            </>
          ) : (
            <>
              {/* Renter-specific ratings */}
              {renderStarRating(
                reliabilityRating,
                setReliabilityRating,
                'Pålitelighet (betaling, stell av hest, etc.)'
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-6 border-t">
          <Button
            type="submit"
            disabled={isSubmitting || rating < 1}
            className="flex-1"
          >
            {isSubmitting 
              ? 'Lagrer...' 
              : existingReview 
                ? 'Oppdater anmeldelse'
                : 'Publiser anmeldelse'
            }
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  )
}