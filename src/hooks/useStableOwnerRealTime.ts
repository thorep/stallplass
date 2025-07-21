import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/supabase-auth-context'
import { useQueryClient } from '@tanstack/react-query'
import { 
  getStableOwnerRentals,
  getStableOwnerRentalStats,
  subscribeToStableOwnerRentals,
  unsubscribeFromRentalChannel,
  RentalWithRelations
} from '@/services/rental-service'
import {
  getStableOwnerPayments,
  subscribeToStableOwnerPayments,
  PaymentWithRelations
} from '@/services/realtime-service'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'

type Rental = Tables<'utleie'>
type Payment = Tables<'betalinger'>

/**
 * Real-time hook for stable owner rentals with simple data updates
 */
export function useStableOwnerRentals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [rentals, setRentals] = useState<RentalWithRelations[]>([])
  const [stats, setStats] = useState<{
    totalRentals: number
    activeRentals: number
    pendingRentals: number
    monthlyRevenue: number
  }>({
    totalRentals: 0,
    activeRentals: 0,
    pendingRentals: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial data
  const fetchRentals = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const [rentalData, statsData] = await Promise.all([
        getStableOwnerRentals(user.id),
        getStableOwnerRentalStats(user.id)
      ])
      
      setRentals(rentalData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching rental data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rental data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Handle real-time rental changes
  const handleRentalChange = useCallback((rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    setRentals(currentRentals => {
      switch (eventType) {
        case 'INSERT':
          // Refetch to get full relation data
          fetchRentals()
          return currentRentals
        case 'UPDATE':
          return currentRentals.map(r => 
            r.id === rental.id 
              ? { ...r, ...rental }
              : r
          )
        case 'DELETE':
          return currentRentals.filter(r => r.id !== rental.id)
        default:
          return currentRentals
      }
    })

    // Refresh stats when rentals change
    if (user?.id) {
      getStableOwnerRentalStats(user.id).then(setStats).catch(console.error)
    }

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['rentals'] })
    queryClient.invalidateQueries({ queryKey: ['stables'] })
  }, [fetchRentals, queryClient, user?.id])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    fetchRentals()

    // Set up real-time subscription
    channelRef.current = subscribeToStableOwnerRentals(user.id, handleRentalChange)

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id, fetchRentals, handleRentalChange])

  return {
    rentals,
    stats,
    loading,
    error,
    refetch: fetchRentals
  }
}

/**
 * Real-time hook for stable owner payments with simple data updates
 */
export function useStableOwnerPayments() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial payments
  const fetchPayments = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const paymentData = await getStableOwnerPayments(user.id)
      setPayments(paymentData)
    } catch (err) {
      console.error('Error fetching payment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payment data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Handle real-time payment changes
  const handlePaymentUpdate = useCallback((payment: Payment, eventType: 'INSERT' | 'UPDATE') => {
    if (eventType === 'INSERT') {
      // Refetch to get full relation data
      fetchPayments()
    } else if (eventType === 'UPDATE') {
      setPayments(currentPayments => 
        currentPayments.map(p => 
          p.id === payment.id 
            ? { ...p, ...payment }
            : p
        )
      )
    }

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['payments'] })
  }, [fetchPayments, queryClient])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    fetchPayments()

    // Set up real-time subscription
    channelRef.current = subscribeToStableOwnerPayments(user.id, handlePaymentUpdate)

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id, fetchPayments, handlePaymentUpdate])

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments
  }
}

/**
 * Comprehensive stable owner real-time data hook - simplified
 */
export function useStableOwnerDashboard() {
  const rentals = useStableOwnerRentals()
  const payments = useStableOwnerPayments()

  const loading = rentals.loading || payments.loading
  const error = rentals.error || payments.error

  return {
    rentals: rentals.rentals,
    rentalStats: rentals.stats,
    payments: payments.payments,
    loading,
    error,
    actions: {
      refetchRentals: rentals.refetch,
      refetchPayments: payments.refetch
    }
  }
}