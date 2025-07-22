'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRealTimeRentals } from '@/hooks/useRealTimeRentals'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UsersIcon,
  HomeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface RealTimeRentalAnalyticsProps {
  ownerId: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

interface AnalyticsData {
  totalRentals: number
  activeRentals: number
  pendingRentals: number
  completedRentals: number
  cancelledRentals: number
  monthlyRevenue: number
  averageRentalDuration: number
  conversionRate: number
  occupancyRate: number
  recentTrends: {
    period: string
    newRequests: number
    confirmations: number
    cancellations: number
    revenue: number
  }[]
  statusDistribution: Record<string, number>
  revenueByBox: { boxName: string; revenue: number; occupancy: number }[]
  conflictRate: number
  customerSatisfaction: number
}

export default function RealTimeRentalAnalytics({ 
  ownerId, 
  timeRange = '30d' 
}: RealTimeRentalAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Use real-time rentals for live data
  const {
    rentals,
    conflicts,
    actions
  } = useRealTimeRentals({
    ownerId,
    enabled: true,
    includeAnalytics: true
  })

  // Calculate comprehensive analytics
  const calculateAnalytics = useMemo(() => {
    if (!rentals || rentals.length === 0) return null

    const now = new Date()
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    }

    const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange])
    const filteredRentals = rentals.filter(r => 
      r.created_at && new Date(r.created_at) >= cutoffDate
    )

    // Status distribution
    const statusDistribution = filteredRentals.reduce((acc, rental) => {
      const status = rental.status || 'UNKNOWN'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Revenue calculations
    const activeRentals = filteredRentals.filter(r => r.status === 'ACTIVE')
    const monthlyRevenue = activeRentals.reduce((sum, r) => sum + r.monthly_price, 0)

    // Revenue by box
    const revenueByBox = rentals.reduce((acc, rental) => {
      if (rental.status === 'ACTIVE' && rental.box) {
        const existing = acc.find(item => item.boxName === rental.box.name)
        if (existing) {
          existing.revenue += rental.monthly_price
          existing.occupancy = 100 // Occupied
        } else {
          acc.push({
            boxName: rental.box.name,
            revenue: rental.monthly_price,
            occupancy: 100
          })
        }
      }
      return acc
    }, [] as { boxName: string; revenue: number; occupancy: number }[])

    // Conversion rate (based on actual rental statuses)
    const activeRentalsCount = statusDistribution['ACTIVE'] || 0
    const cancelledRentalsCount = statusDistribution['CANCELLED'] || 0
    const endedRentalsCount = statusDistribution['ENDED'] || 0
    const totalRentalsWithStatus = activeRentalsCount + cancelledRentalsCount + endedRentalsCount
    const conversionRate = totalRentalsWithStatus > 0 ? ((activeRentalsCount + endedRentalsCount) / totalRentalsWithStatus) * 100 : 0

    // Average rental duration (mock calculation)
    const completedRentals = filteredRentals.filter(r => r.status === 'ENDED')
    const averageRentalDuration = completedRentals.length > 0 
      ? completedRentals.reduce((sum, rental) => {
          if (rental.end_date) {
            const start = new Date(rental.start_date)
            const end = new Date(rental.end_date)
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          }
          return sum + 30 // Default to 30 days if no end date
        }, 0) / completedRentals.length
      : 30

    // Occupancy rate (simplified)
    const totalBoxes = revenueByBox.length || 1
    const occupiedBoxes = activeRentals.length
    const occupancyRate = (occupiedBoxes / totalBoxes) * 100

    // Recent trends (weekly data for the selected period)
    const weeksToShow = Math.min(4, Math.floor(timeRangeMs[timeRange] / (7 * 24 * 60 * 60 * 1000)))
    const recentTrends = Array.from({ length: weeksToShow }, (_, i) => {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      
      const weekRentals = filteredRentals.filter(r => {
        if (!r.created_at) return false
        const createdAt = new Date(r.created_at)
        return createdAt >= weekStart && createdAt < weekEnd
      })

      return {
        period: `Uke ${Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
        newRequests: weekRentals.length, // All new rentals created in this period
        confirmations: weekRentals.filter(r => r.status === 'ACTIVE').length,
        cancellations: weekRentals.filter(r => r.status === 'CANCELLED').length,
        revenue: weekRentals.filter(r => r.status === 'ACTIVE').reduce((sum, r) => sum + r.monthly_price, 0)
      }
    }).reverse()

    // Conflict rate
    const conflictRate = conflicts.length > 0 ? (conflicts.length / filteredRentals.length) * 100 : 0

    return {
      totalRentals: filteredRentals.length,
      activeRentals: activeRentalsCount,
      pendingRentals: 0, // No pending status in rental_status enum
      completedRentals: statusDistribution['ENDED'] || 0,
      cancelledRentals: statusDistribution['CANCELLED'] || 0,
      monthlyRevenue,
      averageRentalDuration,
      conversionRate,
      occupancyRate,
      recentTrends,
      statusDistribution,
      revenueByBox,
      conflictRate,
      customerSatisfaction: 85 // Mock data - would come from reviews
    }
  }, [rentals, timeRange, conflicts])

  // Update analytics when data changes
  useEffect(() => {
    if (calculateAnalytics) {
      setAnalyticsData(calculateAnalytics)
      setLastUpdated(new Date())
      setIsLoading(false)
    }
  }, [calculateAnalytics])

  // Auto-refresh every minute
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      actions.refresh()
      setLastUpdated(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [autoRefresh, actions])

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ElementType,
    color: string = 'blue',
    change?: number
  ) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      gray: 'text-gray-600 bg-gray-100'
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {React.createElement(icon, { className: 'h-6 w-6' })}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {change !== undefined && (
                <div className={`ml-2 flex items-center text-sm ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStatusChart = () => {
    if (!analyticsData) return null

    const total = analyticsData.totalRentals
    if (total === 0) return <div className="text-center py-4 text-gray-500">Ingen data å vise</div>

    const statuses = [
      { key: 'ACTIVE', label: 'Aktive', color: 'bg-green-500' },
      { key: 'ENDED', label: 'Avsluttede', color: 'bg-gray-500' },
      { key: 'CANCELLED', label: 'Avbrutte', color: 'bg-red-500' }
    ]

    return (
      <div className="space-y-4">
        {statuses.map(status => {
          const count = analyticsData.statusDistribution[status.key] || 0
          const percentage = (count / total) * 100

          return (
            <div key={status.key} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{status.label}</span>
                  <span className="text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${status.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderRevenueChart = () => {
    if (!analyticsData) return null

    return (
      <div className="space-y-4">
        {analyticsData.revenueByBox.slice(0, 5).map((box) => (
          <div key={box.boxName} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{box.boxName}</p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${(box.revenue / Math.max(...analyticsData.revenueByBox.map(b => b.revenue))) * 100}%` }}
                />
              </div>
            </div>
            <div className="ml-4 text-right">
              <p className="text-sm font-medium text-gray-900">{box.revenue.toLocaleString()} kr</p>
              <p className="text-xs text-gray-500">100% opptatt</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTrendsChart = () => {
    if (!analyticsData) return null

    return (
      <div className="space-y-4">
        {analyticsData.recentTrends.map((trend, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
            <p className="text-sm font-medium text-gray-900 mb-2">{trend.period}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Forespørsler</p>
                <p className="font-medium text-blue-600">{trend.newRequests}</p>
              </div>
              <div>
                <p className="text-gray-500">Bekreftelser</p>
                <p className="font-medium text-green-600">{trend.confirmations}</p>
              </div>
              <div>
                <p className="text-gray-500">Inntekt</p>
                <p className="font-medium text-green-600">{trend.revenue.toLocaleString()} kr</p>
              </div>
            </div>
          </div>
        ))}
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

  if (!analyticsData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen data tilgjengelig</h3>
        <p className="mt-1 text-sm text-gray-500">
          Det er ikke nok data for å generere analyser ennå.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leieanalyse</h2>
          <p className="text-sm text-gray-500">
            Sist oppdatert: {lastUpdated.toLocaleTimeString('nb-NO')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              autoRefresh 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {autoRefresh ? 'Auto-oppdatering på' : 'Auto-oppdatering av'}
          </button>
          <button
            onClick={() => {
              actions.refresh()
              setLastUpdated(new Date())
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Oppdater
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Totale leieforhold',
          analyticsData.totalRentals,
          HomeIcon,
          'blue'
        )}
        {renderMetricCard(
          'Aktive leieforhold',
          analyticsData.activeRentals,
          CheckCircleIcon,
          'green'
        )}
        {renderMetricCard(
          'Månedlig inntekt',
          `${analyticsData.monthlyRevenue.toLocaleString()} kr`,
          CurrencyDollarIcon,
          'green'
        )}
        {renderMetricCard(
          'Konverteringsrate',
          `${analyticsData.conversionRate.toFixed(1)}%`,
          ArrowTrendingUpIcon,
          'blue'
        )}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Beleggsgrad',
          `${analyticsData.occupancyRate.toFixed(1)}%`,
          UsersIcon,
          'yellow'
        )}
        {renderMetricCard(
          'Snitt leietid',
          `${analyticsData.averageRentalDuration.toFixed(0)} dager`,
          CalendarIcon,
          'gray'
        )}
        {renderMetricCard(
          'Konfliktrate',
          `${analyticsData.conflictRate.toFixed(1)}%`,
          ExclamationTriangleIcon,
          analyticsData.conflictRate > 5 ? 'red' : 'green'
        )}
        {renderMetricCard(
          'Kundetilfredshet',
          `${analyticsData.customerSatisfaction}%`,
          CheckCircleIcon,
          'green'
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statusfordeling</h3>
          {renderStatusChart()}
        </div>

        {/* Revenue by Box */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inntekt per boks</h3>
          {renderRevenueChart()}
        </div>

        {/* Recent Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Trender</h3>
          {renderTrendsChart()}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Live aktivitet</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {/* Lifecycle events removed - not using real-time features */}
              <li className="text-center py-8 text-gray-500">
                Ingen aktivitetslogg tilgjengelig
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}