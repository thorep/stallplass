import { Database } from '@/types/supabase'

// Simple table name type
type TableName = keyof Database['public']['Tables']

/**
 * Simple utilities for common real-time patterns
 */

// Filter builders for common patterns
export const filters = {
  /**
   * Filter by user ID
   */
  byUser: (userId: string) => `bruker_id=eq.${userId}`,
  
  /**
   * Filter by owner ID
   */
  byOwner: (ownerId: string) => `eier_id=eq.${ownerId}`,
  
  /**
   * Filter by stable ID
   */
  byStable: (stableId: string) => `stall_id=eq.${stableId}`,
  
  /**
   * Filter by conversation ID
   */
  byConversation: (conversationId: string) => `samtale_id=eq.${conversationId}`,
  
  /**
   * Filter for active/non-deleted records
   */
  active: () => `slettet_dato=is.null`,
  
  /**
   * Filter by status
   */
  byStatus: (status: string) => `status=eq.${status}`,
  
  /**
   * Filter by multiple values
   */
  byValues: (column: string, values: string[]) => `${column}=in.(${values.join(',')})`,
  
  /**
   * Combine multiple filters with AND
   */
  and: (...filters: string[]) => filters.filter(Boolean).join(','),
}

// Common real-time patterns
export const patterns = {
  /**
   * User's own records pattern
   */
  userOwned: (userId: string) => ({
    filter: filters.byUser(userId),
    events: ['INSERT', 'UPDATE', 'DELETE'] as const,
  }),
  
  /**
   * Stable owner's data pattern
   */
  stableOwner: (ownerId: string) => ({
    filter: filters.byOwner(ownerId),
    events: ['INSERT', 'UPDATE', 'DELETE'] as const,
  }),
  
  /**
   * Active records only pattern
   */
  activeRecords: () => ({
    filter: filters.active(),
    events: ['INSERT', 'UPDATE'] as const, // Don't listen to DELETE for soft-deleted
  }),
  
  /**
   * Conversation messages pattern
   */
  conversationMessages: (conversationId: string) => ({
    filter: filters.byConversation(conversationId),
    events: ['INSERT', 'UPDATE'] as const, // Messages are rarely deleted
  }),
  
  /**
   * User's active conversations pattern
   */
  userConversations: (userId: string) => ({
    filter: filters.and(
      `participants=cs.["${userId}"]`, // Contains user in participants array
      filters.active()
    ),
    events: ['INSERT', 'UPDATE'] as const,
  }),
}

// Error handling utilities
export const errorHandlers = {
  /**
   * Simple console error logger
   */
  logError: (context: string) => (error: Error) => {
    console.error(`[SimpleRealtime] ${context}:`, error.message)
  },
  
  /**
   * Toast notification error handler (requires toast function)
   */
  toastError: (toast: (message: string) => void) => (error: Error) => {
    toast(`Real-time error: ${error.message}`)
  },
  
  /**
   * Retry on error handler
   */
  retryOnError: (retryFn: () => void, maxRetries: number = 3) => {
    let retryCount = 0
    return (error: Error) => {
      if (retryCount < maxRetries) {
        retryCount++
        console.warn(`[SimpleRealtime] Retrying after error (${retryCount}/${maxRetries}):`, error.message)
        setTimeout(retryFn, 1000 * retryCount) // Exponential backoff
      } else {
        console.error(`[SimpleRealtime] Max retries reached:`, error.message)
      }
    }
  },
}

// Subscription helpers
export const subscriptions = {
  /**
   * Create a subscription key for caching/deduplication
   */
  createKey: (table: TableName, filter?: string) => `${table}${filter ? `-${filter}` : ''}`,
  
  /**
   * Parse filter string into components
   */
  parseFilter: (filter: string) => {
    const parts = filter.split('=')
    if (parts.length !== 2) return null
    
    const [column, operatorAndValue] = parts
    const operatorMatch = operatorAndValue.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|in|is)\.(.+)$/)
    
    if (!operatorMatch) return null
    
    const [, operator, value] = operatorMatch
    return { column, operator, value }
  },
  
  /**
   * Validate table name exists in database
   */
  isValidTable: (table: string): table is TableName => {
    const validTables = [
      'users', 'stables', 'boxes', 'conversations', 'messages', 
      'rentals', 'reviews', 'payments', 'stable_amenities', 
      'box_amenities', 'stable_faqs', 'roadmap_items', 'page_views'
    ]
    return validTables.includes(table)
  },
}

// Data transformation utilities
export const transforms = {
  /**
   * Sort data by opprettet_dato (newest first)
   */
  sortByNewest: <T extends { opprettet_dato: string }>(data: T[]): T[] => 
    [...data].sort((a, b) => new Date(b.opprettet_dato).getTime() - new Date(a.opprettet_dato).getTime()),
  
  /**
   * Sort data by updated_at (newest first)
   */
  sortByUpdated: <T extends { updated_at: string }>(data: T[]): T[] => 
    [...data].sort((a, b) => new Date(b.oppdatert_dato).getTime() - new Date(a.oppdatert_dato).getTime()),
  
  /**
   * Filter out soft-deleted records
   */
  filterActive: <T extends { deleted_at?: string | null }>(data: T[]): T[] => 
    data.filter(item => !item.deleted_at),
  
  /**
   * Group data by a property
   */
  groupBy: <T, K extends keyof T>(data: T[], key: K): Record<string, T[]> => {
    return data.reduce((groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },
}

// Hook composition helpers
export const compose = {
  /**
   * Combine multiple real-time subscriptions
   */
  useMultipleTables: <T extends TableName>(
    subscriptions: Array<{
      table: T
      filter?: string
      events?: ('INSERT' | 'UPDATE' | 'DELETE')[]
    }>
  ) => {
    // This would return an object with each subscription's data
    // Implementation would use the individual hooks
    return subscriptions.reduce((acc, sub) => {
      acc[sub.table] = {
        // This is a placeholder - actual implementation would use the hooks
        data: [],
        loading: false,
        error: null,
        connected: false,
      }
      return acc
    }, {} as Record<T, unknown>)
  },
}

// Development utilities
export const dev = {
  /**
   * Log all real-time events for debugging
   */
  createDebugHandler: (tableName: string) => (error: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[SimpleRealtime Debug] ${tableName}`)
      console.error('Error:', error.message)
      console.trace()
      console.groupEnd()
    }
  },
  
  /**
   * Create a mock error for testing
   */
  createMockError: (message: string = 'Mock error') => new Error(message),
}