/**
 * Simple Real-time Hooks and Utilities
 * 
 * A clean, minimal set of hooks and utilities for real-time data updates
 * across the stallplass platform. These provide basic functionality without
 * the complexity of the full real-time system.
 * 
 * @example Basic table subscription
 * ```typescript
 * import { useSimpleRealtimeTable } from '@/hooks/simple-realtime'
 * 
 * function StablesList() {
 *   const { data: stables, loading, error, connected } = useSimpleRealtimeTable('stables')
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!connected) return <div>Real-time updates unavailable</div>
 *   
 *   return (
 *     <div>
 *       {stables.map(stable => (
 *         <div key={stable.id}>{stable.name}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 * 
 * @example Single record subscription
 * ```typescript
 * import { useSimpleRealtimeRecord } from '@/hooks/simple-realtime'
 * 
 * function StableDetails({ id }: { id: string }) {
 *   const { data: stable, loading, exists } = useSimpleRealtimeRecord('stables', id)
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (!exists) return <div>Stable not found</div>
 *   
 *   return <div>{stable?.name}</div>
 * }
 * ```
 * 
 * @example With filters and utilities
 * ```typescript
 * import { useSimpleRealtimeTable, filters, patterns } from '@/hooks/simple-realtime'
 * 
 * function UserStables({ userId }: { userId: string }) {
 *   const { data: userStables } = useSimpleRealtimeTable('stables', {
 *     filter: filters.byOwner(userId),
 *     events: ['INSERT', 'UPDATE']
 *   })
 *   
 *   return <div>{userStables.length} stables</div>
 * }
 * 
 * function ConversationMessages({ conversationId }: { conversationId: string }) {
 *   const { data: messages } = useSimpleRealtimeTable('messages', 
 *     patterns.conversationMessages(conversationId)
 *   )
 *   
 *   return <div>{messages.length} messages</div>
 * }
 * ```
 */

// Main hooks
export { useSimpleRealtimeTable } from './useSimpleRealtimeTable'
export { useSimpleRealtimeRecord } from './useSimpleRealtimeRecord'
export { useSimpleRealtimeStatus, useSimpleRealtimeStatusCallback } from './useSimpleRealtimeStatus'

// Utilities
export { 
  filters, 
  patterns, 
  errorHandlers, 
  subscriptions, 
  transforms, 
  compose,
  dev 
} from './simpleRealtimeUtils'

// Connection management
export { 
  simpleConnectionManager, 
  connectionUtils,
  type SimpleConnectionState,
  type SimpleConnectionConfig 
} from './simpleConnectionManager'

// Re-export types for convenience
export type {
  // From useSimpleRealtimeTable
  SimpleSubscriptionOptions,
  SimpleRealtimeTableResult,
} from './useSimpleRealtimeTable'

export type {
  // From useSimpleRealtimeRecord  
  SimpleRecordOptions,
  SimpleRealtimeRecordResult,
} from './useSimpleRealtimeRecord'

export type {
  // From useSimpleRealtimeStatus
  SimpleConnectionStatus,
} from './useSimpleRealtimeStatus'

/**
 * Quick start guide:
 * 
 * 1. For table subscriptions: useSimpleRealtimeTable('table_name')
 * 2. For single records: useSimpleRealtimeRecord('table_name', id)
 * 3. For connection status: useSimpleRealtimeStatus()
 * 4. Use filters and patterns for common use cases
 * 5. Use errorHandlers for error management
 * 6. Use transforms for data manipulation
 * 
 * All hooks automatically:
 * - Load initial data
 * - Subscribe to real-time updates
 * - Handle connection errors
 * - Clean up on unmount
 * - Provide loading and error states
 */