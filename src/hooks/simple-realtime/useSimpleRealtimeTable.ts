import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase, Tables } from '@/lib/supabase'
import { Database } from '@/types/supabase'

// Simple table name type
type TableName = keyof Database['public']['Tables']

// Simple subscription options
export interface SimpleSubscriptionOptions {
  filter?: string // Simple filter like "user_id=eq.123"
  events?: readonly ('INSERT' | 'UPDATE' | 'DELETE')[] | ('INSERT' | 'UPDATE' | 'DELETE')[]
  onError?: (error: Error) => void
}

// Simple return type
export interface SimpleRealtimeTableResult<T extends TableName> {
  data: Tables<T>[]
  loading: boolean
  error: string | null
  connected: boolean
  refresh: () => Promise<void>
}

/**
 * Simple real-time table subscription hook
 * 
 * @param table - Table name to subscribe to
 * @param options - Simple subscription options
 * @returns Real-time data and control functions
 * 
 * @example
 * ```typescript
 * const { data, loading, error, connected } = useSimpleRealtimeTable('stables')
 * const { data: userStables } = useSimpleRealtimeTable('stables', {
 *   filter: `owner_id=eq.${userId}`
 * })
 * ```
 */
export function useSimpleRealtimeTable<T extends TableName>(
  table: T,
  options: SimpleSubscriptionOptions = {}
): SimpleRealtimeTableResult<T> {
  const [data, setData] = useState<Tables<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(table).select('*')
      
      // Apply simple filter
      if (options.filter) {
        const [column, operator, value] = options.filter.split(/[=.]/)
        if (column && operator && value) {
          query = query.eq(column as never, value)
        }
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (mountedRef.current) {
        setData((result || []) as unknown as Tables<T>[])
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
        setError(errorMessage)
        setLoading(false)
        options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }, [table, options])

  // Process real-time updates
  const handleRealtimeUpdate = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (!mountedRef.current) return

    setData(currentData => {
      const newData = [...currentData]
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            // Avoid duplicates
            const exists = newData.find((item: Record<string, unknown>) => item.id === payload.new.id)
            if (!exists) {
              newData.push(payload.new as Tables<T>)
            }
          }
          break
          
        case 'UPDATE':
          if (payload.new) {
            const index = newData.findIndex((item: Record<string, unknown>) => item.id === payload.new.id)
            if (index >= 0) {
              newData[index] = payload.new as Tables<T>
            } else {
              // Add if not found (edge case)
              newData.push(payload.new as Tables<T>)
            }
          }
          break
          
        case 'DELETE':
          if (payload.old) {
            const index = newData.findIndex((item: Record<string, unknown>) => item.id === payload.old.id)
            if (index >= 0) {
              newData.splice(index, 1)
            }
          }
          break
      }
      
      return newData
    })
  }, [])

  // Setup real-time subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      try {
        // Create channel
        const channelName = `table-${table}-${Date.now()}`
        channel = supabase.channel(channelName)
        channelRef.current = channel

        // Configure postgres changes listener
        const config: Record<string, unknown> = {
          event: '*',
          schema: 'public',
          table: table
        }

        // Add filter if specified
        if (options.filter) {
          config.filter = options.filter
        }

        // Set up listeners for specific events or all events
        if (options.events && options.events.length > 0) {
          options.events.forEach(eventType => {
            channel!.on(
              'postgres_changes' as never,
              { ...config, event: eventType },
              handleRealtimeUpdate
            )
          })
        } else {
          channel.on('postgres_changes' as never, config, handleRealtimeUpdate)
        }

        // Subscribe to channel
        await channel.subscribe((status) => {
          if (!mountedRef.current) return

          switch (status) {
            case 'SUBSCRIBED':
              setConnected(true)
              setError(null)
              break
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              setConnected(false)
              setError('Connection error')
              options.onError?.(new Error('Real-time connection error'))
              break
            case 'CLOSED':
              setConnected(false)
              break
          }
        })

      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to setup subscription'
          setError(errorMessage)
          setConnected(false)
          options.onError?.(err instanceof Error ? err : new Error(errorMessage))
        }
      }
    }

    // Load initial data and setup subscription
    loadData()
    setupSubscription()

    // Cleanup
    return () => {
      mountedRef.current = false
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [table, handleRealtimeUpdate, loadData, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    connected,
    refresh: loadData,
  }
}