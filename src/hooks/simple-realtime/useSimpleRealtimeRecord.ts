import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase, Tables } from '@/lib/supabase'
import { Database } from '@/types/supabase'

// Simple table name type
type TableName = keyof Database['public']['Tables']

// Simple record subscription options
export interface SimpleRecordOptions {
  onError?: (error: Error) => void
  onDeleted?: () => void // Called when record is deleted
}

// Simple return type for single record
export interface SimpleRealtimeRecordResult<T extends TableName> {
  data: Tables<T> | null
  loading: boolean
  error: string | null
  connected: boolean
  exists: boolean
  refresh: () => Promise<void>
}

/**
 * Simple real-time single record subscription hook
 * 
 * @param table - Table name to subscribe to
 * @param id - Record ID to watch
 * @param options - Simple subscription options
 * @returns Real-time record data and control functions
 * 
 * @example
 * ```typescript
 * const { data: stable, loading, exists } = useSimpleRealtimeRecord('stables', stableId)
 * const { data: user } = useSimpleRealtimeRecord('users', userId, {
 *   onDeleted: () => navigate('/users')
 * })
 * ```
 */
export function useSimpleRealtimeRecord<T extends TableName>(
  table: T,
  id: string | null | undefined,
  options: SimpleRecordOptions = {}
): SimpleRealtimeRecordResult<T> {
  const [data, setData] = useState<Tables<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [exists, setExists] = useState(true)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const mountedRef = useRef(true)

  // Load initial data
  const loadData = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      setExists(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id' as never, id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Record not found
          if (mountedRef.current) {
            setData(null)
            setExists(false)
            setLoading(false)
          }
          return
        }
        throw fetchError
      }

      if (mountedRef.current) {
        setData(result as unknown as Tables<T>)
        setExists(true)
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load record'
        setError(errorMessage)
        setLoading(false)
        options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }, [table, id, options])

  // Process real-time updates
  const handleRealtimeUpdate = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (!mountedRef.current || !id) return

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && payload.new.id === id) {
          setData(payload.new as Tables<T>)
          setExists(true)
        }
        break
        
      case 'UPDATE':
        if (payload.new && payload.new.id === id) {
          setData(payload.new as Tables<T>)
          setExists(true)
        }
        break
        
      case 'DELETE':
        if (payload.old && payload.old.id === id) {
          setData(null)
          setExists(false)
          options.onDeleted?.()
        }
        break
    }
  }, [id, options])

  // Setup real-time subscription
  useEffect(() => {
    if (!id) {
      setData(null)
      setLoading(false)
      setExists(false)
      setConnected(false)
      return
    }

    let channel: RealtimeChannel | null = null

    const setupSubscription = async () => {
      try {
        // Create channel
        const channelName = `record-${table}-${id}-${Date.now()}`
        channel = supabase.channel(channelName)
        channelRef.current = channel

        // Configure postgres changes listener for this specific record
        const config = {
          event: '*',
          schema: 'public',
          table: table,
          filter: `id=eq.${id}`
        }

        channel.on('postgres_changes' as never, config, handleRealtimeUpdate)

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
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [table, id, handleRealtimeUpdate, loadData, options])

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
    exists,
    refresh: loadData,
  }
}