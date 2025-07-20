# Simple Real-time Hooks

A clean, minimal set of React hooks and utilities for real-time data updates in the stallplass platform. These provide basic functionality without the complexity of the full real-time system.

## Overview

This simple real-time system provides:
- ✅ Basic table subscriptions (`useSimpleRealtimeTable`)
- ✅ Single record subscriptions (`useSimpleRealtimeRecord`)
- ✅ Connection status monitoring (`useSimpleRealtimeStatus`)
- ✅ Simple error handling and reconnection
- ✅ Common filter patterns and utilities
- ✅ Clean subscription management and cleanup

## Quick Start

```typescript
import { 
  useSimpleRealtimeTable, 
  useSimpleRealtimeRecord, 
  filters 
} from '@/hooks/simple-realtime'

// Basic table subscription
const { data, loading, error, connected } = useSimpleRealtimeTable('stables')

// Filtered table subscription  
const { data: userStables } = useSimpleRealtimeTable('stables', {
  filter: filters.byOwner(userId)
})

// Single record subscription
const { data: stable, exists } = useSimpleRealtimeRecord('stables', stableId)
```

## Hooks

### `useSimpleRealtimeTable(table, options)`

Subscribe to real-time updates for an entire table.

**Parameters:**
- `table`: Table name (e.g., 'stables', 'messages', 'users')
- `options`: Optional configuration object

**Options:**
- `filter`: PostgreSQL filter string (e.g., "user_id=eq.123")
- `events`: Array of events to listen for (['INSERT', 'UPDATE', 'DELETE'])
- `onError`: Error callback function

**Returns:**
- `data`: Array of table records
- `loading`: Boolean indicating initial load state
- `error`: Error message string or null
- `connected`: Boolean indicating real-time connection status
- `refresh`: Function to manually reload data

**Example:**
```typescript
function StablesList() {
  const { data: stables, loading, error, connected } = useSimpleRealtimeTable('stables', {
    filter: 'available_boxes=gt.0', // Only stables with available boxes
    events: ['INSERT', 'UPDATE'],   // Don't listen to deletes
    onError: (error) => console.error('Stables error:', error)
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!connected) return <div>Real-time updates unavailable</div>

  return (
    <div>
      {stables.map(stable => (
        <div key={stable.id}>{stable.name}</div>
      ))}
    </div>
  )
}
```

### `useSimpleRealtimeRecord(table, id, options)`

Subscribe to real-time updates for a single record.

**Parameters:**
- `table`: Table name
- `id`: Record ID to watch
- `options`: Optional configuration object

**Options:**
- `onError`: Error callback function
- `onDeleted`: Callback when record is deleted

**Returns:**
- `data`: Single record object or null
- `loading`: Boolean indicating initial load state
- `error`: Error message string or null
- `connected`: Boolean indicating real-time connection status
- `exists`: Boolean indicating if record exists
- `refresh`: Function to manually reload data

**Example:**
```typescript
function StableDetails({ stableId }: { stableId: string }) {
  const { data: stable, loading, exists } = useSimpleRealtimeRecord('stables', stableId, {
    onDeleted: () => navigate('/stables'), // Redirect when deleted
    onError: (error) => showToast(error.message)
  })

  if (loading) return <div>Loading...</div>
  if (!exists) return <div>Stable not found</div>

  return <div>{stable?.name}</div>
}
```

### `useSimpleRealtimeStatus()`

Monitor global real-time connection status.

**Returns:**
- `connected`: Boolean indicating connection status
- `connecting`: Boolean indicating connection attempt
- `error`: Error message string or null
- `lastConnected`: Date of last successful connection

**Example:**
```typescript
function ConnectionIndicator() {
  const { connected, connecting, error } = useSimpleRealtimeStatus()

  return (
    <div>
      Status: {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

## Utilities

### Filters

Common filter patterns for table subscriptions:

```typescript
import { filters } from '@/hooks/simple-realtime'

// User's own records
filters.byUser(userId)           // "user_id=eq.123"

// Owner's records
filters.byOwner(ownerId)         // "owner_id=eq.123" 

// Stable-specific records
filters.byStable(stableId)       // "stable_id=eq.123"

// Active (non-deleted) records
filters.active()                 // "deleted_at=is.null"

// Specific status
filters.byStatus('available')    // "status=eq.available"

// Multiple values
filters.byValues('status', ['available', 'pending'])  // "status=in.(available,pending)"

// Combine filters
filters.and(
  filters.byUser(userId),
  filters.active()
)  // "user_id=eq.123,deleted_at=is.null"
```

### Patterns

Pre-configured patterns for common use cases:

```typescript
import { patterns } from '@/hooks/simple-realtime'

// User's own records
const { data } = useSimpleRealtimeTable('stables', patterns.userOwned(userId))

// Stable owner's data
const { data } = useSimpleRealtimeTable('boxes', patterns.stableOwner(ownerId))

// Active records only
const { data } = useSimpleRealtimeTable('rentals', patterns.activeRecords())

// Conversation messages
const { data } = useSimpleRealtimeTable('messages', patterns.conversationMessages(conversationId))
```

### Error Handlers

Simple error handling utilities:

```typescript
import { errorHandlers } from '@/hooks/simple-realtime'

// Console logging
const { data } = useSimpleRealtimeTable('stables', {
  onError: errorHandlers.logError('StablesList')
})

// Toast notifications (requires toast function)
const { data } = useSimpleRealtimeTable('stables', {
  onError: errorHandlers.toastError(showToast)
})

// Retry on error
const { data } = useSimpleRealtimeTable('stables', {
  onError: errorHandlers.retryOnError(() => refresh(), 3)
})
```

### Transforms

Data transformation utilities:

```typescript
import { transforms } from '@/hooks/simple-realtime'

// Sort by newest first
const sortedData = transforms.sortByNewest(data)

// Filter out soft-deleted records
const activeData = transforms.filterActive(data)

// Group by property
const groupedData = transforms.groupBy(data, 'status')
```

## Connection Management

Basic connection management is handled automatically, but you can access it directly:

```typescript
import { connectionUtils } from '@/hooks/simple-realtime'

// Check connection status
if (connectionUtils.isConnected()) {
  // Real-time features available
}

// Force reconnection
connectionUtils.reconnect()

// Subscribe to connection changes
const unsubscribe = connectionUtils.subscribe((state) => {
  console.log('Connection state:', state)
})

// Don't forget to unsubscribe
unsubscribe()
```

## Examples

See `/src/components/examples/SimpleRealtimeExamples.tsx` for complete working examples including:

- Basic table listing
- Filtered user data
- Single record details
- Real-time chat messages
- Connection status indicators
- Combined dashboard

## Best Practices

1. **Use filters early**: Filter data at the database level rather than in React
2. **Handle loading states**: Always show loading indicators
3. **Handle errors gracefully**: Provide error callbacks and fallbacks
4. **Clean up subscriptions**: Hooks automatically clean up, but be mindful in custom logic
5. **Monitor connection status**: Show users when real-time features are unavailable
6. **Use patterns**: Leverage pre-built patterns for common use cases

## Comparison with Full System

This simple system differs from the full real-time system (`src/hooks/useRealtimeTable.ts`) by:

**Simple System:**
- ✅ Easy to use and understand
- ✅ Minimal configuration required
- ✅ Basic error handling and reconnection
- ✅ Essential features only
- ✅ Great for most use cases

**Full System:**
- Complex configuration options
- Advanced features (batching, throttling, optimistic updates)
- Detailed metrics and performance monitoring
- Advanced error handling and retry logic
- Better for high-performance requirements

Choose the simple system for most use cases, and the full system only when you need advanced features.

## Migration

To migrate from the full system to the simple system:

```typescript
// Before (full system)
const { data } = useRealtimeTable('stables', {
  filter: 'user_id=eq.123',
  throttle: 500,
  batch: true,
  enableOptimisticUpdates: true
})

// After (simple system)
const { data } = useSimpleRealtimeTable('stables', {
  filter: filters.byUser('123')
})
```

The simple system automatically handles performance optimizations without requiring configuration.