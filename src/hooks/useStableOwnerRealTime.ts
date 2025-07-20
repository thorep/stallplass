import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useQueryClient } from '@tanstack/react-query'
import { 
  getStableOwnerRentals,
  getStableOwnerRentalStats,
  subscribeToStableOwnerRentals,
  subscribeToNewRentalRequests,
  subscribeToRentalStatusChanges,
  unsubscribeFromRentalChannel,
  RentalWithRelations
} from '@/services/rental-service'
import {
  getStableOwnerPayments,
  subscribeToStableOwnerPayments,
  StableOwnerNotificationManager,
  StableOwnerNotification,
  PaymentWithRelations
} from '@/services/notification-service'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'

type Rental = Tables<'rentals'>
type Payment = Tables<'payments'>
type Stable = Tables<'stables'>
type Box = Tables<'boxes'>
type User = Tables<'users'>
type Conversation = Tables<'conversations'>

/**
 * Real-time hook for stable owner rentals
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
    if (!user?.uid) return

    try {
      setLoading(true)
      setError(null)
      
      const [rentalData, statsData] = await Promise.all([
        getStableOwnerRentals(user.uid),
        getStableOwnerRentalStats(user.uid)
      ])
      
      setRentals(rentalData)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching rental data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rental data')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

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
    if (user?.uid) {
      getStableOwnerRentalStats(user.uid).then(setStats).catch(console.error)
    }

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['rentals'] })
    queryClient.invalidateQueries({ queryKey: ['stables'] })
  }, [fetchRentals, queryClient, user?.uid])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.uid) return

    // Initial fetch
    fetchRentals()

    // Set up real-time subscription
    channelRef.current = subscribeToStableOwnerRentals(user.uid, handleRentalChange)

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.uid, fetchRentals, handleRentalChange])

  return {
    rentals,
    stats,
    loading,
    error,
    refetch: fetchRentals
  }
}

/**
 * Real-time hook for stable owner payments
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
    if (!user?.uid) return

    try {
      setLoading(true)
      setError(null)
      const paymentData = await getStableOwnerPayments(user.uid)
      setPayments(paymentData)
    } catch (err) {
      console.error('Error fetching payment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payment data')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

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
    if (!user?.uid) return

    // Initial fetch
    fetchPayments()

    // Set up real-time subscription
    channelRef.current = subscribeToStableOwnerPayments(user.uid, handlePaymentUpdate)

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.uid, fetchPayments, handlePaymentUpdate])

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments
  }
}

/**
 * Real-time hook for stable owner notifications
 */
export function useStableOwnerNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<StableOwnerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const managerRef = useRef<StableOwnerNotificationManager | null>(null)

  // Handle new notifications
  const handleNewNotification = useCallback((notification: StableOwnerNotification) => {
    setNotifications(current => [notification, ...current])
    setUnreadCount(current => current + 1)
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (managerRef.current) {
      managerRef.current.markAsRead(notificationId)
      setNotifications(current =>
        current.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(current => Math.max(0, current - 1))
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(current =>
      current.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearNotifications()
      setNotifications([])
      setUnreadCount(0)
    }
  }, [])

  // Set up notification manager
  useEffect(() => {
    if (!user?.uid) return

    // Create and start notification manager
    managerRef.current = new StableOwnerNotificationManager(user.uid)
    managerRef.current.onNotification(handleNewNotification)
    managerRef.current.startSubscriptions()

    return () => {
      if (managerRef.current) {
        managerRef.current.stopSubscriptions()
        managerRef.current = null
      }
    }
  }, [user?.uid, handleNewNotification])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }
}

/**
 * Real-time hook for new rental requests (high priority notifications)
 */
export function useNewRentalRequests() {
  const { user } = useAuth()
  const [newRequests, setNewRequests] = useState<RentalWithRelations[]>([])
  const [hasNewRequests, setHasNewRequests] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Handle new rental request
  const handleNewRequest = useCallback((rental: RentalWithRelations) => {
    setNewRequests(current => [rental, ...current])
    setHasNewRequests(true)
  }, [])

  // Acknowledge new requests
  const acknowledgeRequests = useCallback(() => {
    setHasNewRequests(false)
    setNewRequests([])
  }, [])

  // Set up subscription
  useEffect(() => {
    if (!user?.uid) return

    channelRef.current = subscribeToNewRentalRequests(user.uid, handleNewRequest)

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.uid, handleNewRequest])

  return {
    newRequests,
    hasNewRequests,
    acknowledgeRequests
  }
}

/**
 * Comprehensive stable owner real-time data hook
 */
export function useStableOwnerDashboard() {
  const rentals = useStableOwnerRentals()
  const payments = useStableOwnerPayments()
  const notifications = useStableOwnerNotifications()
  const newRequests = useNewRentalRequests()

  const loading = rentals.loading || payments.loading
  const error = rentals.error || payments.error

  return {
    rentals: rentals.rentals,
    rentalStats: rentals.stats,
    payments: payments.payments,
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    newRequests: newRequests.newRequests,
    hasNewRequests: newRequests.hasNewRequests,
    loading,
    error,
    actions: {
      refetchRentals: rentals.refetch,
      refetchPayments: payments.refetch,
      markNotificationAsRead: notifications.markAsRead,
      markAllNotificationsAsRead: notifications.markAllAsRead,
      clearNotifications: notifications.clearNotifications,
      acknowledgeNewRequests: newRequests.acknowledgeRequests
    }
  }
}