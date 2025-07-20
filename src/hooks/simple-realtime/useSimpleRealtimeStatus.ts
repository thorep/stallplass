import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// Simple connection status
interface SimpleConnectionStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  lastConnected: Date | null
}

// Simple connection events
type ConnectionEvent = 'connected' | 'disconnected' | 'error'

/**
 * Simple real-time connection status hook
 * 
 * @returns Global real-time connection status
 * 
 * @example
 * ```typescript
 * const { connected, connecting, error } = useSimpleRealtimeStatus()
 * 
 * if (!connected) {
 *   return <div>Real-time features unavailable</div>
 * }
 * ```
 */
export function useSimpleRealtimeStatus() {
  const [status, setStatus] = useState<SimpleConnectionStatus>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
  })
  
  const mountedRef = useRef(true)

  useEffect(() => {
    let connectingTimeout: NodeJS.Timeout | null = null

    // Set connecting state on initial load
    setStatus(prev => ({ ...prev, connecting: true }))

    // Set a timeout to clear connecting state if no connection is established
    connectingTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setStatus(prev => ({ 
          ...prev, 
          connecting: false,
          error: prev.connected ? null : 'Connection timeout'
        }))
      }
    }, 10000) // 10 second timeout

    // Listen to realtime connection events
    const handleOpen = () => {
      if (mountedRef.current) {
        setStatus({
          connected: true,
          connecting: false,
          error: null,
          lastConnected: new Date(),
        })
        if (connectingTimeout) {
          clearTimeout(connectingTimeout)
          connectingTimeout = null
        }
      }
    }

    const handleClose = () => {
      if (mountedRef.current) {
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }))
      }
    }

    const handleError = (error: Error | unknown) => {
      if (mountedRef.current) {
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error?.message || 'Connection error',
        }))
        if (connectingTimeout) {
          clearTimeout(connectingTimeout)
          connectingTimeout = null
        }
      }
    }

    // Set up listeners
    supabase.realtime.onOpen(handleOpen)
    supabase.realtime.onClose(handleClose)
    supabase.realtime.onError(handleError)

    // Cleanup
    return () => {
      mountedRef.current = false
      if (connectingTimeout) {
        clearTimeout(connectingTimeout)
      }
      // Note: We don't remove the global listeners as they should persist
      // across component unmounts
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return status
}

/**
 * Simple real-time connection status hook with callback
 * 
 * @param onStatusChange - Callback for status changes
 * @returns Global real-time connection status
 * 
 * @example
 * ```typescript
 * useSimpleRealtimeStatusCallback((status) => {
 *   if (!status.connected) {
 *     showToast('Real-time connection lost')
 *   }
 * })
 * ```
 */
export function useSimpleRealtimeStatusCallback(
  onStatusChange?: (status: SimpleConnectionStatus, event: ConnectionEvent) => void
) {
  const status = useSimpleRealtimeStatus()
  const previousStatusRef = useRef<SimpleConnectionStatus | null>(null)

  useEffect(() => {
    if (!onStatusChange) return

    const previousStatus = previousStatusRef.current
    previousStatusRef.current = status

    // Determine what changed
    if (previousStatus) {
      if (!previousStatus.connected && status.connected) {
        onStatusChange(status, 'connected')
      } else if (previousStatus.connected && !status.connected) {
        onStatusChange(status, 'disconnected')
      } else if (!previousStatus.error && status.error) {
        onStatusChange(status, 'error')
      }
    }
  }, [status, onStatusChange])

  return status
}