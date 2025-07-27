'use client'

// Placeholder component for removed reviews functionality
interface ReviewListProps {
  reviews?: unknown[]
  showStableName?: boolean
  loading?: boolean
  emptyMessage?: string
}

export function ReviewList({ loading = false, emptyMessage }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <p className="text-gray-600 text-sm">
        {emptyMessage || 'Anmeldelser er midlertidig ikke tilgjengelig.'}
      </p>
    </div>
  )
}

export default ReviewList