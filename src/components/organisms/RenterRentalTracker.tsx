'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRealTimeRenterRentals } from '@/hooks/useRealTimeRentals'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

interface RenterRentalTrackerProps {
  riderId: string
}

export default function RenterRentalTracker({ riderId }: RenterRentalTrackerProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active')

  // Use real-time renter rental hook
  const {
    rentals,
    analytics,
    isLoading,
    error,
    refresh
  } = useRealTimeRenterRentals({
    riderId,
    enabled: true
  })

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

  const activeRentals = rentals.filter(r => r.status === 'ACTIVE')
  const pendingRentals = rentals.filter(r => r.status === 'PENDING')
  const historyRentals = rentals.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-amber-600" />
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-slate-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-slate-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-amber-100 text-amber-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const renderRentalCard = (rental: any) => (
    <div key={rental.id} className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <HomeIcon className="h-5 w-5 text-slate-400" />
            <h3 className="font-medium text-slate-900">
              {rental.box.name} - {rental.stable.name}
            </h3>
          </div>
          
          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>{rental.monthly_price} kr/måned</span>
            </div>
            {rental.start_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Startet: {new Date(rental.start_date).toLocaleDateString('nb-NO')}</span>
              </div>
            )}
            {rental.end_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Slutter: {new Date(rental.end_date).toLocaleDateString('nb-NO')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
            {getStatusIcon(rental.status)}
            <span className="ml-1">{rental.status}</span>
          </span>
          
          {rental.conversation_id && (
            <button className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>Meldinger</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Mine Leieforhold</h2>
        <p className="text-slate-600">Oversikt over dine aktive og tidligere leieforhold</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Aktive leieforhold</p>
              <p className="text-2xl font-bold text-green-900">{activeRentals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-amber-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-600">Venter på godkjenning</p>
              <p className="text-2xl font-bold text-amber-900">{pendingRentals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Månedlig kostnad</p>
              <p className="text-2xl font-bold text-blue-900">
                {activeRentals.reduce((sum, r) => sum + (r.monthly_price || 0), 0)} kr
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('active')}
              className={`${
                selectedTab === 'active'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Aktive & Ventende
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`${
                selectedTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Historikk
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'active' && (
            <div className="space-y-4">
              {[...activeRentals, ...pendingRentals].length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <HomeIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Ingen aktive leieforhold</p>
                  <p className="text-sm mt-2">Når du sender leieforespørsler vil de vises her.</p>
                </div>
              ) : (
                [...activeRentals, ...pendingRentals].map(renderRentalCard)
              )}
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="space-y-4">
              {historyRentals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Ingen historikk ennå</p>
                  <p className="text-sm mt-2">Fullførte og kansellerte leieforhold vil vises her.</p>
                </div>
              ) : (
                historyRentals.map(renderRentalCard)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}