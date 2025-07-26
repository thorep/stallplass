// Import RealtimePostgresChangesPayload when needed
// import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Define table names based on Prisma schema
export type TableName = 'users' | 'stables' | 'boxes' | 'conversations' | 'messages' | 'rentals' | 'payments' | 'reviews' | 'stable_amenities' | 'box_amenities' | 'page_views'

// Generic row types - these will need to be replaced with Prisma types when used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TableRow<T extends TableName> = Record<string, unknown>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TableInsert<T extends TableName> = Record<string, unknown>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TableUpdate<T extends TableName> = Record<string, unknown>

// Real-time event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

// Enhanced payload with better typing
export interface TypedRealtimePayload<T extends TableName> {
  eventType: RealtimeEvent
  new: TableRow<T> | null
  old: TableRow<T> | null
  table: T
  schema: 'public'
  timestamp: string
}

// Subscription options
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SubscriptionOptions<T extends TableName = TableName> {
  // Event filtering
  events?: RealtimeEvent[]
  
  // Row filtering
  filter?: string // PostgreSQL filter syntax, e.g., "id=eq.123"
  
  // Performance options
  throttle?: number // Milliseconds to throttle updates
  batch?: boolean // Batch multiple updates
  batchDelay?: number // Delay for batching (ms)
  
  // Error handling
  retryOnError?: boolean
  maxRetries?: number
  retryDelay?: number
  
  // Lifecycle callbacks
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onReconnect?: () => void
}

// Hook return type
export interface RealtimeSubscription<T extends TableName> {
  // Data state
  data: TableRow<T>[]
  isLoading: boolean
  error: string | null
  
  // Connection state
  isConnected: boolean
  isReconnecting: boolean
  connectionAttempts: number
  
  // Control functions
  refresh: () => Promise<void>
  reconnect: () => void
  disconnect: () => void
  clearError: () => void
  
  // Update functions
  addOptimisticUpdate: (data: TableRow<T>) => void
  removeOptimisticUpdate: (id: string) => void
  updateOptimisticUpdate: (id: string, updates: Partial<TableRow<T>>) => void
}

// Filter builder types
export interface FilterBuilder<T extends TableName> {
  eq: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  neq: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  gt: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  gte: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  lt: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  lte: (column: keyof TableRow<T>, value: unknown) => FilterBuilder<T>
  in: (column: keyof TableRow<T>, values: unknown[]) => FilterBuilder<T>
  like: (column: keyof TableRow<T>, pattern: string) => FilterBuilder<T>
  ilike: (column: keyof TableRow<T>, pattern: string) => FilterBuilder<T>
  is: (column: keyof TableRow<T>, value: null | boolean) => FilterBuilder<T>
  and: (filters: FilterBuilder<T>[]) => FilterBuilder<T>
  or: (filters: FilterBuilder<T>[]) => FilterBuilder<T>
  build: () => string
}

// Batch update types
export interface BatchUpdate<T extends TableName> {
  id: string
  timestamp: Date
  updates: TypedRealtimePayload<T>[]
}

// Connection status for individual subscriptions
export interface SubscriptionStatus {
  isConnected: boolean
  isReconnecting: boolean
  connectionAttempts: number
  lastConnected: Date | null
  lastError: string | null
  subscriptionId: string
}

// Performance metrics
export interface SubscriptionMetrics {
  totalUpdates: number
  updatesPerSecond: number
  averageLatency: number
  errorCount: number
  reconnectionCount: number
  lastUpdateTime: Date | null
}

// Optimistic update types
export interface OptimisticUpdate<T extends TableName> {
  id: string
  type: 'add' | 'update' | 'remove'
  data: TableRow<T>
  timestamp: Date
  confirmed: boolean
}

// Multi-table subscription types
export interface MultiTableSubscription {
  tables: TableName[]
  options: Record<TableName, SubscriptionOptions<TableName>>
  onUpdate?: (table: TableName, payload: TypedRealtimePayload<TableName>) => void
}

// Relationship subscription types for joining data
export interface RelationshipConfig<T extends TableName> {
  table: T
  foreignKey: keyof TableRow<T>
  localKey: string
  select?: string
}

export interface JoinedSubscription<
  MainTable extends TableName,
  JoinTable extends TableName = MainTable
> {
  main: {
    table: MainTable
    select?: string
    filter?: string
  }
  joins?: RelationshipConfig<JoinTable>[]
  options?: SubscriptionOptions<MainTable>
}

// Hook configuration
export interface RealtimeHookConfig {
  // Global settings
  enableOptimisticUpdates: boolean
  enableMetrics: boolean
  enableBatching: boolean
  defaultBatchDelay: number
  
  // Error handling
  defaultRetryAttempts: number
  defaultRetryDelay: number
  
  // Performance
  defaultThrottleInterval: number
  maxConcurrentSubscriptions: number
  
  // Debugging
  enableLogging: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

// Query builder for real-time subscriptions
export interface RealtimeQueryBuilder<T extends TableName> {
  from: (table: T) => RealtimeQueryBuilder<T>
  select: (columns?: string) => RealtimeQueryBuilder<T>
  filter: (column: keyof TableRow<T>, operator: string, value: unknown) => RealtimeQueryBuilder<T>
  eq: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  neq: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  gt: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  gte: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  lt: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  lte: (column: keyof TableRow<T>, value: unknown) => RealtimeQueryBuilder<T>
  in: (column: keyof TableRow<T>, values: unknown[]) => RealtimeQueryBuilder<T>
  like: (column: keyof TableRow<T>, pattern: string) => RealtimeQueryBuilder<T>
  ilike: (column: keyof TableRow<T>, pattern: string) => RealtimeQueryBuilder<T>
  is: (column: keyof TableRow<T>, value: null | boolean) => RealtimeQueryBuilder<T>
  order: (column: keyof TableRow<T>, ascending?: boolean) => RealtimeQueryBuilder<T>
  limit: (count: number) => RealtimeQueryBuilder<T>
  range: (from: number, to: number) => RealtimeQueryBuilder<T>
  subscribe: (options?: SubscriptionOptions<T>) => RealtimeSubscription<T>
}

// Event callback types
export type RealtimeEventCallback<T extends TableName> = (payload: TypedRealtimePayload<T>) => void
export type RealtimeErrorCallback = (error: Error, context?: unknown) => void
export type RealtimeStatusCallback = (status: SubscriptionStatus) => void

// Utility types for common patterns
export interface TimestampedRow {
  created_at: string
  updated_at?: string
}

export interface UserOwnedRow {
  user_id: string
}

export interface SoftDeleteRow {
  deleted_at?: string | null
}

// Common filter patterns
export type UserFilter = { user_id: string }
export type StableFilter = { stable_id: string }
export type ConversationFilter = { conversation_id: string }
export type ActiveFilter = { deleted_at: null }
export type DateRangeFilter = { 
  created_at: { gte: string; lte?: string } 
}

// Aggregate data types for analytics
export interface AggregateData {
  count: number
  sum?: number
  avg?: number
  min?: unknown
  max?: unknown
  grouped?: Record<string, unknown>
}

// Real-time analytics subscription
export interface AnalyticsSubscription {
  metric: string
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'
  groupBy?: string[]
  filter?: string
  interval?: number // Refresh interval in ms
  data: AggregateData
  lastUpdated: Date | null
}