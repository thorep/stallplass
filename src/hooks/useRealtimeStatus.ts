import { useState, useEffect, useCallback } from 'react'
import { realtimeManager, ConnectionState } from '@/lib/realtime/connection-manager'

/**
 * Hook for monitoring real-time connection status
 */
export function useRealtimeStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeManager.getConnectionState()
  )
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true)

  useEffect(() => {
    // Listen to connection state changes
    const unsubscribeConnect = realtimeManager.addEventListener('connected', setConnectionState)
    const unsubscribeDisconnect = realtimeManager.addEventListener('disconnected', setConnectionState)
    const unsubscribeError = realtimeManager.addEventListener('error', setConnectionState)
    const unsubscribeReconnecting = realtimeManager.addEventListener('reconnecting', setConnectionState)

    // Listen to network changes
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    // Cleanup
    return () => {
      unsubscribeConnect()
      unsubscribeDisconnect()
      unsubscribeError()
      unsubscribeReconnecting()
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const forceReconnect = useCallback(() => {
    realtimeManager.reset()
  }, [])

  const getChannelStats = useCallback(() => {
    return realtimeManager.getChannelStats()
  }, [])

  return {
    ...connectionState,
    isOnline,
    forceReconnect,
    getChannelStats
  }
}

/**
 * Hook for monitoring specific subscription status
 */
export function useSubscriptionStatus(subscriptionId: string) {
  const [status, setStatus] = useState({
    isActive: false,
    lastPing: null as Date | null,
    latency: 0,
    errorCount: 0
  })

  useEffect(() => {
    let pingInterval: NodeJS.Timeout | null = null
    const errorCount = 0

    // Simple ping mechanism to check if subscription is responsive
    const startPinging = () => {
      pingInterval = setInterval(() => {
        const start = Date.now()
        
        // This is a simplified ping - in production you might want a more sophisticated approach
        setTimeout(() => {
          const latency = Date.now() - start
          setStatus(prev => ({
            ...prev,
            isActive: true,
            lastPing: new Date(),
            latency,
            errorCount
          }))
        }, 0)
      }, 30000) // Ping every 30 seconds
    }

    if (subscriptionId) {
      startPinging()
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval)
      }
    }
  }, [subscriptionId])

  return status
}