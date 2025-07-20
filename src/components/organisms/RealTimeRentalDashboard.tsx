'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRealTimeRentals } from '@/hooks/useRealTimeRentals'
import { updateRentalStatusSafe, RentalConflict } from '@/services/rental-status-service'
import { 
  StableOwnerNotificationManager,
  StableOwnerNotification 
} from '@/services/notification-service'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface RealTimeRentalDashboardProps {
  ownerId: string
}

export default function RealTimeRentalDashboard({ ownerId }: RealTimeRentalDashboardProps) {
  const { user } = useAuth()
  const [notificationManager, setNotificationManager] = useState<StableOwnerNotificationManager | null>(null)
  const [notifications, setNotifications] = useState<StableOwnerNotification[]>([])
  const [selectedTab, setSelectedTab] = useState<'overview' | 'rentals' | 'conflicts' | 'analytics'>('overview')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // Use real-time rental hook
  const {
    rentals,
    analytics,
    conflicts,
    lifecycleEvents,
    isLoading,
    error,
    refresh,
    resolveConflict,
    getActiveRentalsForBox,
    getRentalsByStatus
  } = useRealTimeRentals({
    ownerId,
    enabled: true,
    trackAnalytics: true,
    detectConflicts: true
  })

  // Set up notification manager
  useEffect(() => {
    if (ownerId && !notificationManager) {
      const manager = new StableOwnerNotificationManager(ownerId)
      
      manager.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)])
      })
      
      manager.startSubscriptions()
      setNotificationManager(manager)

      return () => {
        manager.stopSubscriptions()
      }
    }
  }, [ownerId, notificationManager])

  // Handle status updates
  const handleStatusUpdate = async (rentalId: string, newStatus: string, reason?: string) => {
    if (!user) return

    setIsUpdatingStatus(rentalId)
    try {
      const result = await updateRentalStatusSafe(
        rentalId,
        newStatus as any,
        user.uid,
        reason
      )

      if (result.success) {
        // Status updated successfully, real-time hooks will update the UI
        if (result.conflicts && result.conflicts.length > 0) {
          // Show conflicts but still allow the update
          console.log('Status updated with conflicts:', result.conflicts)
        }
      } else {
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update rental status')
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  // Handle conflict resolution
  const handleConflictResolution = async (conflict: RentalConflict, strategy: string) => {
    try {
      await resolveConflict(conflict.id, `Resolved using ${strategy}`)
    } catch (error) {
      console.error('Error resolving conflict:', error)
    }
  }

  const renderStatusBadge = (status: string) => {
    const badges = {
      PENDING: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ClockIcon className="w-4 h-4 mr-1" />
        Venter
      </span>,
      CONFIRMED: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Bekreftet
      </span>,
      ACTIVE: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Aktiv
      </span>,
      COMPLETED: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Fullført
      </span>,
      CANCELLED: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Avbrutt
      </span>
    }
    return badges[status as keyof typeof badges] || <span className="text-gray-500">{status}</span>
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Totale leieforhold</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.totalRentals}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Aktive leieforhold</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.activeRentals}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ventende forespørsler</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.pendingRentals}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Månedlig inntekt</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.monthlyRevenue.toLocaleString()} kr</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Siste aktivitet</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {lifecycleEvents.slice(0, 5).map((event, idx) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {idx !== 4 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Leieforhold <span className="font-medium text-gray-900">{event.rentalId}</span> endret til{' '}
                            <span className="font-medium">{event.status}</span>
                          </p>
                          {event.metadata?.reason && (
                            <p className="text-xs text-gray-400">{event.metadata.reason}</p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {event.timestamp.toLocaleDateString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Urgent Notifications */}
      {notifications.filter(n => n.priority === 'URGENT' && !n.read).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Krever umiddelbar oppmerksomhet
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {notifications
                    .filter(n => n.priority === 'URGENT' && !n.read)
                    .slice(0, 3)
                    .map(notification => (
                      <li key={notification.id}>{notification.message}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderRentalsTab = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Alle leieforhold</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leietaker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stall / Boks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Periode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Månedspris
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentals.map((rental) => (
              <tr key={rental.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {rental.rider?.name || rental.rider?.email}
                  </div>
                  <div className="text-sm text-gray-500">{rental.rider?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{rental.stable?.name}</div>
                  <div className="text-sm text-gray-500">{rental.box?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(rental.start_date).toLocaleDateString('nb-NO')}
                  {rental.end_date && (
                    <> - {new Date(rental.end_date).toLocaleDateString('nb-NO')}</>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rental.monthly_price.toLocaleString()} kr
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(rental.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {rental.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(rental.id, 'CONFIRMED', 'Godkjent av eier')}
                          disabled={isUpdatingStatus === rental.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          Godkjenn
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(rental.id, 'CANCELLED', 'Avvist av eier')}
                          disabled={isUpdatingStatus === rental.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Avvis
                        </button>
                      </>
                    )}
                    {rental.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(rental.id, 'ACTIVE', 'Startet av eier')}
                        disabled={isUpdatingStatus === rental.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Start leie
                      </button>
                    )}
                    {rental.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusUpdate(rental.id, 'COMPLETED', 'Fullført av eier')}
                        disabled={isUpdatingStatus === rental.id}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        Fullfør
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderConflictsTab = () => (
    <div className="space-y-6">
      {conflicts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-green-800">Ingen konflikter</h3>
          <p className="mt-1 text-sm text-green-600">
            Alle leieforhold fungerer uten problemer.
          </p>
        </div>
      ) : (
        conflicts.map((conflict) => (
          <div key={conflict.id} className="bg-white rounded-lg shadow border-l-4 border-red-400">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {conflict.type} - {conflict.severity}
                    </h3>
                    <p className="text-sm text-gray-500">{conflict.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {conflict.autoResolvable && (
                    <button
                      onClick={() => handleConflictResolution(conflict, 'auto')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Auto-løs
                    </button>
                  )}
                  <button
                    onClick={() => handleConflictResolution(conflict, 'manual')}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    Manuell løsning
                  </button>
                </div>
              </div>
              {conflict.metadata?.suggestedActions && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Foreslåtte handlinger:</h4>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
                    {conflict.metadata.suggestedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {analytics && (
        <>
          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Konverteringsrate</h3>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">Forespørsler som blir aktive leieforhold</p>
              </div>
              <div className="ml-6">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Recent Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trender denne måneden</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.recentTrends.newRequests}
                </div>
                <p className="text-sm text-gray-500">Nye forespørsler</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.recentTrends.confirmations}
                </div>
                <p className="text-sm text-gray-500">Bekreftelser</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analytics.recentTrends.cancellations}
                </div>
                <p className="text-sm text-gray-500">Avbrudd</p>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inntektsfordeling</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aktive leieforhold</span>
                <span className="font-medium">{analytics.monthlyRevenue.toLocaleString()} kr/måned</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gjennomsnittlig per boks</span>
                <span className="font-medium">
                  {analytics.activeRentals > 0 
                    ? (analytics.monthlyRevenue / analytics.activeRentals).toLocaleString()
                    : '0'} kr/måned
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Feil ved lasting av data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leieforvaltning</h1>
        <div className="flex items-center space-x-4">
          {notifications.filter(n => !n.read).length > 0 && (
            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            </div>
          )}
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Oppdater
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Oversikt' },
            { key: 'rentals', label: 'Leieforhold' },
            { key: 'conflicts', label: 'Konflikter', count: conflicts.length },
            { key: 'analytics', label: 'Analyse' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'rentals' && renderRentalsTab()}
        {selectedTab === 'conflicts' && renderConflictsTab()}
        {selectedTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  )
}