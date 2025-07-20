import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { realtimeManager } from '@/lib/realtime/connection-manager'
import {
  TableName,
  TableRow,
  SubscriptionOptions,
  RealtimeSubscription,
  TypedRealtimePayload,
  OptimisticUpdate,
  SubscriptionMetrics
} from '@/lib/realtime/types'
import {
  realtimeUtils,
  throttle,
  debounce,
  createBatcher,
  retryWithBackoff,
  createSubscriptionId,
  validateSubscriptionOptions,
  deepClone,
  calculateMetrics
} from '@/lib/realtime/utils'

/**
 * Generic real-time table subscription hook
 * Provides type-safe real-time updates for any Supabase table
 */
export function useRealtimeTable<T extends TableName>(
  table: T,
  options: SubscriptionOptions<T> = {}
): RealtimeSubscription<T> {
  // State management
  const [data, setData] = useState<TableRow<T>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  // Optimistic updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate<T>[]>([])
  
  // Performance metrics
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    totalUpdates: 0,
    updatesPerSecond: 0,
    averageLatency: 0,
    errorCount: 0,
    reconnectionCount: 0,
    lastUpdateTime: null
  })

  // Refs for cleanup and stability
  const channelRef = useRef<RealtimeChannel | null>(null)
  const subscriptionIdRef = useRef<string>('')
  const mountedRef = useRef(true)
  const updateTimestampsRef = useRef<Date[]>([])
  const retryCountRef = useRef(0)

  // Validate options
  useEffect(() => {
    const validationErrors = validateSubscriptionOptions(options)
    if (validationErrors.length > 0) {
      console.error('Invalid subscription options:', validationErrors)
      setError(`Invalid options: ${validationErrors.join(', ')}`)
    }
  }, [options])

  // Create batching and throttling functions
  const updateBatcher = useCallback(() => {
    if (!options.batch) return null
    
    return createBatcher<TypedRealtimePayload<T>>(
      (batches) => {
        if (!mountedRef.current) return
        
        // Process all updates in batch
        batches.forEach(payload => processRealtimeUpdate(payload))
        
        // Update metrics
        updateTimestampsRef.current.push(new Date())
        const newMetrics = calculateMetrics(updateTimestampsRef.current)
        setMetrics(prev => ({
          ...prev,
          totalUpdates: prev.totalUpdates + batches.length,
          updatesPerSecond: newMetrics.updatesPerSecond,
          lastUpdateTime: new Date()
        }))
      },
      options.batchDelay || 100
    )
  }, [options.batch, options.batchDelay])

  const throttledUpdate = useCallback(
    throttle((payload: TypedRealtimePayload<T>) => {
      if (!mountedRef.current) return
      processRealtimeUpdate(payload)
    }, options.throttle || 0),
    [options.throttle]
  )

  // Process real-time updates
  const processRealtimeUpdate = useCallback((payload: TypedRealtimePayload<T>) => {
    if (!mountedRef.current) return

    setData(currentData => {
      const newData = [...currentData]
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            // Check for duplicates
            const exists = newData.find((item: TableRow<T>) => item.id === payload.new!.id)
            if (!exists) {
              newData.push(payload.new)
            }
          }
          break
          
        case 'UPDATE':
          if (payload.new) {
            const index = newData.findIndex((item: TableRow<T>) => item.id === payload.new!.id)
            if (index >= 0) {
              newData[index] = payload.new
            } else {
              // Item doesn't exist, add it
              newData.push(payload.new)
            }
          }
          break
          
        case 'DELETE':
          if (payload.old) {
            const index = newData.findIndex((item: TableRow<T>) => item.id === payload.old!.id)
            if (index >= 0) {
              newData.splice(index, 1)
            }
          }
          break
      }
      
      return newData
    })

    // Remove confirmed optimistic updates
    if (payload.new) {
      setOptimisticUpdates(prev => 
        prev.filter(update => update.data.id !== payload.new!.id)
      )
    }
  }, [])

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase.from(table).select('*')
      
      // Apply filter if provided
      if (options.filter) {
        // Parse the filter string and apply it
        // This is a simplified version - in production you'd want more robust parsing
        const filterParts = options.filter.split('=')
        if (filterParts.length === 2) {
          const [column, value] = filterParts
          query = query.eq(column, value)
        }
      }

      const { data: initialData, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (mountedRef.current) {
        setData(initialData || [])
        setIsLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load initial data')
        setIsLoading(false)
        setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
      }
    }
  }, [table, options.filter])

  // Setup real-time subscription
  const setupSubscription = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      // Clean up existing subscription
      if (channelRef.current) {
        realtimeManager.removeChannel(subscriptionIdRef.current)
        channelRef.current = null
      }

      // Create subscription ID
      subscriptionIdRef.current = createSubscriptionId(table, options.filter)
      
      // Create channel
      const channel = realtimeManager.createChannel(subscriptionIdRef.current)
      channelRef.current = channel

      // Setup postgres changes listener
      const changesConfig: Record<string, unknown> = {
        event: '*',
        schema: 'public',
        table: table
      }

      // Add filter if specified
      if (options.filter) {
        changesConfig.filter = options.filter
      }

      // Filter by events if specified
      if (options.events && options.events.length > 0) {
        // Set up multiple listeners for each event type
        options.events.forEach(eventType => {
          channel.on(
            'postgres_changes',
            { ...changesConfig, event: eventType },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              const typedPayload: TypedRealtimePayload<T> = {
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                new: payload.new,
                old: payload.old,
                table: table,
                schema: 'public',
                timestamp: new Date().toISOString()
              }

              // Use batching or throttling if configured
              const batcher = updateBatcher()
              if (batcher && options.batch) {
                batcher.add(typedPayload)
              } else if (options.throttle) {
                throttledUpdate(typedPayload)
              } else {
                processRealtimeUpdate(typedPayload)
              }
            }
          )
        })
      } else {
        // Listen to all events
        channel.on(
          'postgres_changes',
          changesConfig,
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            const typedPayload: TypedRealtimePayload<T> = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new,
              old: payload.old,
              table: table,
              schema: 'public',
              timestamp: new Date().toISOString()
            }

            // Use batching or throttling if configured
            const batcher = updateBatcher()
            if (batcher && options.batch) {
              batcher.add(typedPayload)
            } else if (options.throttle) {
              throttledUpdate(typedPayload)
            } else {
              processRealtimeUpdate(typedPayload)
            }
          }
        )
      }

      // Setup channel event handlers
      channel.on('system', {}, (payload) => {
        if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
          setIsConnected(true)
          setIsReconnecting(false)
          retryCountRef.current = 0
          options.onConnect?.()
        }
      })

      // Subscribe to the channel
      await channel.subscribe((status) => {
        if (!mountedRef.current) return

        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true)
            setIsReconnecting(false)
            retryCountRef.current = 0
            break
          case 'CHANNEL_ERROR':
            setIsConnected(false)
            setError('Subscription error')
            setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
            options.onError?.(new Error('Channel error'))
            attemptReconnection()
            break
          case 'TIMED_OUT':
            setIsConnected(false)
            setError('Subscription timed out')
            setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
            options.onError?.(new Error('Subscription timed out'))
            attemptReconnection()
            break
          case 'CLOSED':
            setIsConnected(false)
            options.onDisconnect?.()
            break
        }
      })

    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to setup subscription')
        setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
        options.onError?.(err as Error)
        attemptReconnection()
      }
    }
  }, [table, options, updateBatcher, throttledUpdate, processRealtimeUpdate])

  // Attempt reconnection with retry logic
  const attemptReconnection = useCallback(async () => {
    if (!mountedRef.current || !options.retryOnError) return

    const maxRetries = options.maxRetries || 3
    const retryDelay = options.retryDelay || 1000

    if (retryCountRef.current >= maxRetries) {
      setError(`Max reconnection attempts (${maxRetries}) exceeded`)
      return
    }

    setIsReconnecting(true)
    setConnectionAttempts(prev => prev + 1)
    retryCountRef.current++

    try {
      await retryWithBackoff(
        () => setupSubscription(),
        1, // Single retry here, we handle the count manually
        retryDelay
      )
      
      options.onReconnect?.()
      setMetrics(prev => ({ 
        ...prev, 
        reconnectionCount: prev.reconnectionCount + 1 
      }))
    } catch (err) {
      if (mountedRef.current) {
        setError(`Reconnection failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsReconnecting(false)
      }
    }
  }, [options, setupSubscription])

  // Control functions
  const refresh = useCallback(async () => {
    await loadInitialData()
  }, [loadInitialData])

  const reconnect = useCallback(async () => {
    retryCountRef.current = 0
    await setupSubscription()
  }, [setupSubscription])

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      realtimeManager.removeChannel(subscriptionIdRef.current)
      channelRef.current = null
    }
    setIsConnected(false)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Optimistic update functions
  const addOptimisticUpdate = useCallback((newData: TableRow<T>) => {
    const update: OptimisticUpdate<T> = {
      id: (newData as TableRow<T>).id || `temp_${Date.now()}`,
      type: 'add',
      data: newData,
      timestamp: new Date(),
      confirmed: false
    }
    
    setOptimisticUpdates(prev => [...prev, update])
    setData(prev => [...prev, newData])
  }, [])

  const removeOptimisticUpdate = useCallback((id: string) => {
    setOptimisticUpdates(prev => prev.filter(update => update.id !== id))
    setData(prev => prev.filter((item: TableRow<T>) => item.id !== id))
  }, [])

  const updateOptimisticUpdate = useCallback((id: string, updates: Partial<TableRow<T>>) => {
    setOptimisticUpdates(prev => 
      prev.map(update => 
        update.id === id 
          ? { ...update, data: { ...update.data, ...updates } }
          : update
      )
    )
    setData(prev => 
      prev.map((item: TableRow<T>) => 
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }, [])

  // Setup and cleanup
  useEffect(() => {
    mountedRef.current = true
    loadInitialData()
    setupSubscription()

    return () => {
      mountedRef.current = false
      if (channelRef.current) {
        realtimeManager.removeChannel(subscriptionIdRef.current)
      }
    }
  }, [loadInitialData, setupSubscription])

  // Combine real data with optimistic updates
  const combinedData = [...data, ...optimisticUpdates.map(update => update.data)]

  return {
    data: combinedData,
    isLoading,
    error,
    isConnected,
    isReconnecting,
    connectionAttempts,
    refresh,
    reconnect,
    disconnect,
    clearError,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    updateOptimisticUpdate
  }
}