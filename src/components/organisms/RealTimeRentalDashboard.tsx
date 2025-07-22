'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/supabase-auth-context'
import { useRealTimeRentals } from '@/hooks/useRealTimeRentals'
import { updateRentalStatusSafe } from '@/services/rental-status-service'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface RealTimeRentalDashboardProps {
  ownerId: string
}

export default function RealTimeRentalDashboard({ ownerId }: RealTimeRentalDashboardProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rentals' | 'conflicts' | 'analytics'>('overview')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // Use real-time rental hook
  const {
    rentals,
    analytics,
    conflicts,
    isLoading,
    error,
    actions
  } = useRealTimeRentals({
    ownerId,
    enabled: true,
    includeAnalytics: true
  })

  // Handle rental status updates
  const handleStatusUpdate = async (rentalId: string, newStatus: string) => {
    if (!user || isUpdatingStatus) return

    setIsUpdatingStatus(rentalId)
    try {
      await updateRentalStatusSafe(
        rentalId,
        newStatus as 'ACTIVE' | 'ENDED' | 'CANCELLED',
        user.id,
        'Status update via dashboard'
      )
      actions.refresh()
    } catch (error) {
      console.error('Failed to update rental status:', error)
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Feil ved lasting av data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Totale leieforhold</p>
              <p className="text-2xl font-bold text-blue-900">{rentals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Aktive</p>
              <p className="text-2xl font-bold text-green-900">
                {rentals.filter(r => r.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-amber-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-600">Venter</p>
              <p className="text-2xl font-bold text-amber-900">
                {rentals.filter(r => !r.status || r.status === null).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Konflikter</p>
              <p className="text-2xl font-bold text-red-900">{conflicts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Siste aktivitet</h3>
        <div className="space-y-3">
          {/* Lifecycle events removed - not using real-time features */}
          <div className="text-center py-4 text-slate-500">
            Ingen aktivitet å vise
          </div>
        </div>
      </div>
    </div>
  )

  const renderRentals = () => (
    <div className="space-y-4">
      {rentals.map((rental) => (
        <div key={rental.id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900">
                {rental.box.name} - {rental.stable.name}
              </h4>
              <p className="text-sm text-slate-600">
                Leietaker: {rental.rider.name || rental.rider.email}
              </p>
              <p className="text-sm text-slate-600">
                Status: <span className="font-medium">{rental.status}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {(!rental.status || rental.status === null) && (
                <button
                  onClick={() => handleStatusUpdate(rental.id, 'ACTIVE')}
                  disabled={isUpdatingStatus === rental.id}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Aktiver
                </button>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rental.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                (!rental.status || rental.status === null) ? 'bg-amber-100 text-amber-800' :
                rental.status === 'ENDED' ? 'bg-slate-100 text-slate-800' :
                'bg-red-100 text-red-800'
              }`}>
                {rental.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderConflicts = () => (
    <div className="space-y-4">
      {conflicts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>Ingen konflikter funnet</p>
        </div>
      ) : (
        conflicts.map((conflict) => (
          <div key={conflict.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-red-900">{conflict.type}</h4>
                <p className="text-sm text-red-700 mt-1">{conflict.description}</p>
                <p className="text-xs text-red-600 mt-2">
                  Oppdaget: {new Date().toLocaleString('nb-NO')}
                </p>
              </div>
              <button
                onClick={() => console.log('Conflict resolution not implemented', conflict.id)}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Løs konflikt
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Inntektsanalyse</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-600">Total månedlig inntekt:</span>
            <span className="font-medium">{analytics?.monthlyRevenue || 0} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Gjennomsnittspris:</span>
            <span className="font-medium">0 kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Belegg:</span>
            <span className="font-medium">0%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Trender</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Nye leieforhold (30 dager):</span>
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="font-medium">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Oversikt', icon: ChartBarIcon },
    { id: 'rentals', name: 'Leieforhold', icon: CheckCircleIcon },
    { id: 'conflicts', name: 'Konflikter', icon: ExclamationTriangleIcon },
    { id: 'analytics', name: 'Analyse', icon: CurrencyDollarIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Live Leieforhold Dashboard</h2>
        <p className="text-slate-600">Real-time oversikt over dine leieforhold og aktivitet</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'rentals' | 'conflicts' | 'analytics')}
                className={`${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'rentals' && renderRentals()}
          {selectedTab === 'conflicts' && renderConflicts()}
          {selectedTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  )
}