/**
 * Example components demonstrating simple real-time hooks usage
 * These are for development/testing purposes only
 * 
 * NOTE: The simple-realtime hooks have been removed from the project.
 * This file is kept for reference but is not functional.
 */

// TODO: This file needs to be updated to use the new real-time implementation
// or removed entirely if no longer needed.

export {}

/*
import React from 'react'
import { 
  useSimpleRealtimeTable, 
  useSimpleRealtimeRecord, 
  useSimpleRealtimeStatus,
  filters,
  patterns,
  errorHandlers
} from '@/hooks/simple-realtime'

// Example 1: Basic table subscription
export function SimpleStablesList() {
  const { data: stables, loading, error, connected } = useSimpleRealtimeTable('stables', {
    select: ['id', 'name', 'location', 'created_at']
  })
  
  if (loading) return <div>Loading stables...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <div>Connection: {connected ? '🟢' : '🔴'}</div>
      <ul>
        {stables.map(stable => (
          <li key={stable.id}>{stable.name} - {stable.location}</li>
        ))}
      </ul>
    </div>
  )
}

// Example 2: Single record with relations
export function SimpleStableDetail({ stableId }: { stableId: string }) {
  const { data: stable, loading, error } = useSimpleRealtimeRecord('stables', stableId, {
    select: ['*', 'boxes(*)']
  })
  
  if (loading) return <div>Loading stable...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!stable) return <div>Stable not found</div>
  
  return (
    <div>
      <h2>{stable.name}</h2>
      <p>Boxes: {stable.boxes?.length || 0}</p>
    </div>
  )
}

// Example 3: Filtered table with patterns
export function SimpleAvailableBoxes() {
  const { data: boxes, loading, error } = useSimpleRealtimeTable('boxes', {
    filter: filters.and(
      filters.equals('is_available', true),
      filters.greaterThan('price', 0)
    ),
    orderBy: { column: 'price', ascending: true }
  })
  
  if (loading) return <div>Loading boxes...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {boxes.map(box => (
        <li key={box.id}>{box.name} - ${box.price}</li>
      ))}
    </ul>
  )
}

// Example 4: Connection status monitoring
export function SimpleConnectionStatus() {
  const { connected, error, reconnectAttempts } = useSimpleRealtimeStatus()
  
  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error.message}</p>}
      {reconnectAttempts > 0 && <p>Reconnect attempts: {reconnectAttempts}</p>}
    </div>
  )
}

// Example 5: Advanced filtering
export function SimpleSearchableStables() {
  const [search, setSearch] = React.useState('')
  
  const { data: stables, loading, error, refetch } = useSimpleRealtimeTable('stables', {
    filter: search ? filters.textSearch('name', search) : undefined,
    debounce: 300
  })
  
  return (
    <div>
      <input 
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search stables..."
      />
      
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}
      
      <ul>
        {stables.map(stable => (
          <li key={stable.id}>{stable.name}</li>
        ))}
      </ul>
    </div>
  )
}

// Example 6: Error handling
export function SimpleErrorBoundaryExample() {
  const { data, loading, error } = useSimpleRealtimeTable('invalid_table', {
    onError: (err) => {
      console.error('Custom error handler:', err)
      // Could send to error tracking service
    }
  })
  
  if (loading) return <div>Loading...</div>
  if (error) {
    // Check error type
    if (errorHandlers.isConnectionError(error)) {
      return <div>Connection error. Please check your internet.</div>
    }
    if (errorHandlers.isPermissionError(error)) {
      return <div>You don't have permission to view this data.</div>
    }
    return <div>Unknown error: {error.message}</div>
  }
  
  return <div>Data loaded successfully</div>
}

// Example 7: Complex patterns
export function SimpleComplexFilters() {
  const { data: boxes } = useSimpleRealtimeTable('boxes', {
    filter: filters.or(
      filters.and(
        filters.equals('is_available', true),
        filters.lessThan('price', 5000)
      ),
      filters.and(
        filters.equals('is_sponsored', true),
        filters.notNull('advertising_until')
      )
    ),
    orderBy: [
      { column: 'is_sponsored', ascending: false },
      { column: 'price', ascending: true }
    ]
  })
  
  return (
    <ul>
      {boxes.map(box => (
        <li key={box.id}>
          {box.name} - ${box.price} {box.is_sponsored && '⭐'}
        </li>
      ))}
    </ul>
  )
}
*/