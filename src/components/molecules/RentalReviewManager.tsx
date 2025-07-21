'use client'

import { useState } from 'react'
import { formatDate } from 'date-fns'
import { nb } from 'date-fns/locale'
import { PencilIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ReviewForm, ReviewFormData } from './ReviewForm'
import Button from '@/components/atoms/Button'
import { useAuth } from '@/lib/supabase-auth-context'

interface RentalWithReviewStatus {
  id: string
  startDate: string
  endDate?: string | null
  status: string
  stable: {
    id: string
    name: string
    owner: {
      firebaseId: string
      name: string | null
    }
  }
  rider: {
    firebaseId: string
    name: string | null
  }
  box: {
    name: string
  }
  canReviewStable: boolean
  canReviewRenter: boolean
  hasReviewedStable: boolean
  hasReviewedRenter: boolean
  reviews: Array<{
    id: string
    revieweeType: 'STABLE_OWNER' | 'RENTER'
    rating: number
    title?: string | null
    comment?: string | null
    communicationRating?: number | null
    cleanlinessRating?: number | null
    facilitiesRating?: number | null
    reliabilityRating?: number | null
  }>
}

interface RentalReviewManagerProps {
  rentals: RentalWithReviewStatus[]
  onCreateReview: (reviewData: ReviewFormData & {
    rentalId: string
    revieweeId: string
    revieweeType: 'STABLE_OWNER' | 'RENTER'
    stable_id: string
  }) => Promise<void>
  onUpdateReview: (reviewId: string, reviewData: ReviewFormData) => Promise<void>
  isSubmitting?: boolean
}

export function RentalReviewManager({
  rentals,
  onCreateReview,
  onUpdateReview,
  isSubmitting = false
}: RentalReviewManagerProps) {
  const { user } = useAuth()
  const [activeForm, setActiveForm] = useState<{
    rentalId: string
    revieweeType: 'STABLE_OWNER' | 'RENTER'
    isEdit: boolean
    reviewId?: string
  } | null>(null)

  if (!user) return null

  const handleSubmitReview = async (reviewData: ReviewFormData) => {
    if (!activeForm) return

    try {
      if (activeForm.isEdit && activeForm.reviewId) {
        await onUpdateReview(activeForm.reviewId, reviewData)
      } else {
        const rental = rentals.find(r => r.id === activeForm.rentalId)
        if (!rental) return

        const revieweeId = activeForm.revieweeType === 'STABLE_OWNER'
          ? rental.stable.owner.firebaseId
          : rental.rider.firebaseId

        await onCreateReview({
          ...reviewData,
          rentalId: activeForm.rentalId,
          revieweeId,
          revieweeType: activeForm.revieweeType,
          stable_id: rental.stable.id
        })
      }
      setActiveForm(null)
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const getExistingReview = (rental: RentalWithReviewStatus, revieweeType: 'STABLE_OWNER' | 'RENTER') => {
    return rental.reviews.find(r => r.revieweeType === revieweeType)
  }

  if (rentals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Du har ingen leieforhold å anmelde ennå.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Mine leieforhold</h3>
      
      {rentals.map((rental) => {
        const isRenter = rental.rider.firebaseId === user.id
        const isStableOwner = rental.stable.owner.firebaseId === user.id
        
        return (
          <div key={rental.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{rental.stable.name}</h4>
              <p className="text-sm text-gray-600">
                {rental.box.name} • {formatDate(new Date(rental.startDate), 'PP', { locale: nb })}
                {rental.endDate && ` - ${formatDate(new Date(rental.endDate), 'PP', { locale: nb })}`}
              </p>
              <p className="text-xs text-gray-500 capitalize">{rental.status.toLowerCase()}</p>
            </div>

            <div className="space-y-3">
              {/* Review Stable Option (for renters) */}
              {isRenter && rental.canReviewStable && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Anmeld stall</p>
                    <p className="text-xs text-gray-600">Del din opplevelse med {rental.stable.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rental.hasReviewedStable ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const existingReview = getExistingReview(rental, 'STABLE_OWNER')
                            setActiveForm({
                              rentalId: rental.id,
                              revieweeType: 'STABLE_OWNER',
                              isEdit: true,
                              reviewId: existingReview?.id
                            })
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setActiveForm({
                          rentalId: rental.id,
                          revieweeType: 'STABLE_OWNER',
                          isEdit: false
                        })}
                      >
                        Anmeld
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Review Renter Option (for stable owners) */}
              {isStableOwner && rental.canReviewRenter && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Anmeld leietaker</p>
                    <p className="text-xs text-gray-600">Del din opplevelse med {rental.rider.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rental.hasReviewedRenter ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const existingReview = getExistingReview(rental, 'RENTER')
                            setActiveForm({
                              rentalId: rental.id,
                              revieweeType: 'RENTER',
                              isEdit: true,
                              reviewId: existingReview?.id
                            })
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setActiveForm({
                          rentalId: rental.id,
                          revieweeType: 'RENTER',
                          isEdit: false
                        })}
                      >
                        Anmeld
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Review Form */}
            {activeForm && activeForm.rentalId === rental.id && (
              <div className="mt-6 pt-6 border-t">
                <ReviewForm
                  revieweeType={activeForm.revieweeType}
                  revieweeName={
                    activeForm.revieweeType === 'STABLE_OWNER'
                      ? rental.stable.name
                      : rental.rider.name || 'Ukjent'
                  }
                  stableName={rental.stable.name}
                  onSubmit={handleSubmitReview}
                  onCancel={() => setActiveForm(null)}
                  existingReview={activeForm.isEdit ? getExistingReview(rental, activeForm.revieweeType) : undefined}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}