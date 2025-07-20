'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRealTimeRenterRentals } from '@/hooks/useRealTimeRentals'
import { RenterNotificationManager, RenterNotification } from '@/services/notification-service'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  HomeIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface RenterRentalTrackerProps {
  riderId: string
}

export default function RenterRentalTracker({ riderId }: RenterRentalTrackerProps) {
  const { user } = useAuth()
  const [notificationManager, setNotificationManager] = useState<RenterNotificationManager | null>(null)
  const [notifications, setNotifications] = useState<RenterNotification[]>([])
  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'notifications'>('active')

  // Use real-time renter rental hook
  const {
    myRentals,
    notifications: rentalNotifications,
    isLoading,
    error,
    clearNotifications,
    clearError
  } = useRealTimeRenterRentals(riderId, true)

  // Set up notification manager
  useEffect(() => {
    if (riderId && !notificationManager) {
      const manager = new RenterNotificationManager(riderId)
      
      manager.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)])
      })
      
      manager.startSubscriptions()
      setNotificationManager(manager)

      return () => {
        manager.stopSubscriptions()
      }
    }
  }, [riderId, notificationManager])

  const renderStatusBadge = (status: string) => {
    const badges = {
      PENDING: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-4 h-4 mr-1" />
          Venter på godkjenning
        </span>
      ),
      CONFIRMED: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Bekreftet
        </span>
      ),
      ACTIVE: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Aktiv leie
        </span>
      ),
      COMPLETED: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Fullført
        </span>
      ),
      CANCELLED: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Avbrutt
        </span>
      )
    }
    return badges[status as keyof typeof badges] || <span className="text-gray-500">{status}</span>
  }

  const getStatusMessage = (status: string) => {
    const messages = {
      PENDING: 'Din forespørsel venter på godkjenning fra stalleier.',
      CONFIRMED: 'Din leie er bekreftet! Du vil snart motta betalingsinformasjon.',
      ACTIVE: 'Din leie er aktiv. Velkommen til stallen!',
      COMPLETED: 'Leieforholdet er fullført. Takk for at du brukte vår tjeneste.',
      CANCELLED: 'Leieforholdet ble avbrutt.'
    }
    return messages[status as keyof typeof messages] || ''
  }

  const getNextSteps = (status: string) => {
    const steps = {
      PENDING: [
        'Vent på godkjenning fra stalleier',
        'Du vil motta en melding når forespørselen blir behandlet',
        'Kontakt stalleier via meldinger hvis du har spørsmål'
      ],
      CONFIRMED: [
        'Vent på oppstartsdato',
        'Fullfør betaling når den blir tilgjengelig',
        'Forbered deg på å flytte inn'
      ],
      ACTIVE: [
        'Nyt din tid i stallen',
        'Kontakt stalleier ved spørsmål eller problemer',
        'Husk månedlige betalinger'
      ],
      COMPLETED: [
        'Vurder stalleier på plattformen',
        'Del din erfaring med andre brukere'
      ],
      CANCELLED: [
        'Søk etter andre tilgjengelige staller',
        'Kontakt kundeservice hvis du har spørsmål'
      ]
    }
    return steps[status as keyof typeof steps] || []
  }

  const renderActiveRentalsTab = () => {
    const activeRentals = myRentals.filter(r => 
      r.status === 'PENDING' || r.status === 'CONFIRMED' || r.status === 'ACTIVE'
    )

    if (activeRentals.length === 0) {
      return (
        <div className="text-center py-12">
          <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen aktive leieforhold</h3>
          <p className="mt-1 text-sm text-gray-500">
            Du har for øyeblikket ingen aktive leieforhold eller ventende forespørsler.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Søk etter staller
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {activeRentals.map((rental) => (
          <div key={rental.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {rental.stable?.name}
                  </h3>
                  <p className="text-sm text-gray-500">{rental.box?.name}</p>
                </div>
                {renderStatusBadge(rental.status)}
              </div>

              {/* Status Message */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">{getStatusMessage(rental.status)}</p>
              </div>

              {/* Rental Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Startdato</p>
                    <p className="text-sm text-gray-500">
                      {new Date(rental.start_date).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Månedspris</p>
                    <p className="text-sm text-gray-500">{rental.monthly_price.toLocaleString()} kr</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Boksstørrelse</p>
                    <p className="text-sm text-gray-500">{rental.box?.monthly_price || 'N/A'} m²</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Neste steg:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getNextSteps(rental.status).map((step, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Send melding
                </button>
                
                {rental.status === 'ACTIVE' && (
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Vis betalinger
                  </button>
                )}

                {rental.status === 'PENDING' && (
                  <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Trekk tilbake
                  </button>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex space-x-4">
                  <span className={`flex items-center ${
                    ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(rental.status) 
                      ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                    Forespørsel sendt
                  </span>
                  <span className={`flex items-center ${
                    ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(rental.status)
                      ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                    Bekreftet
                  </span>
                  <span className={`flex items-center ${
                    ['ACTIVE', 'COMPLETED'].includes(rental.status)
                      ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                    Aktiv
                  </span>
                  <span className={`flex items-center ${
                    rental.status === 'COMPLETED' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                    Fullført
                  </span>
                </div>
                <span className="text-gray-500">
                  Opprettet {new Date(rental.created_at).toLocaleDateString('nb-NO')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderHistoryTab = () => {
    const completedRentals = myRentals.filter(r => 
      r.status === 'COMPLETED' || r.status === 'CANCELLED'
    )

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Leiehistorikk</h3>
        </div>
        
        {completedRentals.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen leiehistorikk</h3>
            <p className="mt-1 text-sm text-gray-500">
              Du har ikke fullført noen leieforhold ennå.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {completedRentals.map((rental) => (
              <div key={rental.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      {rental.stable?.name} - {rental.box?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(rental.start_date).toLocaleDateString('nb-NO')}
                      {rental.end_date && (
                        <> - {new Date(rental.end_date).toLocaleDateString('nb-NO')}</>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {rental.monthly_price.toLocaleString()} kr/måned
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStatusBadge(rental.status)}
                    {rental.status === 'COMPLETED' && (
                      <div className="mt-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Skriv anmeldelse
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderNotificationsTab = () => {
    const allNotifications = [...notifications, ...rentalNotifications.map(event => ({
      id: event.id,
      type: 'RENTAL_UPDATE' as const,
      title: 'Leieforhold oppdatert',
      message: event.metadata?.reason || `Status endret til ${event.status}`,
      timestamp: event.timestamp,
      read: false,
      priority: 'MEDIUM' as const,
      category: 'RENTAL' as const,
      data: { rentalId: event.rentalId }
    }))].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Varsler</h3>
          {allNotifications.filter(n => !n.read).length > 0 && (
            <button
              onClick={() => {
                clearNotifications()
                setNotifications([])
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Marker alle som lest
            </button>
          )}
        </div>

        {allNotifications.length === 0 ? (
          <div className="p-6 text-center">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen varsler</h3>
            <p className="mt-1 text-sm text-gray-500">
              Du har ingen nye varsler om dine leieforhold.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {allNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.priority === 'URGENT' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    ) : notification.category === 'PAYMENT' ? (
                      <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <BellIcon className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.timestamp.toLocaleDateString('nb-NO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

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
              onClick={clearError}
              className="mt-2 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Lukk
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
        <h1 className="text-2xl font-bold text-gray-900">Mine leieforhold</h1>
        <div className="flex items-center space-x-4">
          {notifications.filter(n => !n.read).length > 0 && (
            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'active', label: 'Aktive' },
            { key: 'history', label: 'Historikk' },
            { 
              key: 'notifications', 
              label: 'Varsler',
              count: notifications.filter(n => !n.read).length + rentalNotifications.length
            }
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
        {selectedTab === 'active' && renderActiveRentalsTab()}
        {selectedTab === 'history' && renderHistoryTab()}
        {selectedTab === 'notifications' && renderNotificationsTab()}
      </div>
    </div>
  )
}