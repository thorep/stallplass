/**
 * Example components demonstrating simple real-time hooks usage
 * These are for development/testing purposes only
 */

import React from 'react'
import { 
  useSimpleRealtimeTable, 
  useSimpleRealtimeRecord, 
  useSimpleRealtimeStatus,
  filters,
  patterns,
  errorHandlers
} from '@/hooks/simple-realtime'

/**
 * Example 1: Basic table subscription
 */
export function SimpleStablesList() {
  const { data: stables, loading, error, connected } = useSimpleRealtimeTable('staller', {
    onError: errorHandlers.logError('StablesList')
  })

  if (loading) return <div className="p-4">Loading stables...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!connected) return <div className="p-4 text-yellow-600">Real-time updates unavailable</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Stables ({stables.length})</h2>
      <div className="space-y-2">
        {stables.map(stable => (
          <div key={stable.id} className="p-2 border rounded">
            <div className="font-semibold">{stable.name}</div>
            <div className="text-sm text-gray-600">{stable.location}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 2: Filtered table subscription
 */
export function UserStables({ userId }: { userId: string }) {
  const { data: userStables, loading, error } = useSimpleRealtimeTable('staller', {
    filter: filters.byOwner(userId),
    events: ['INSERT', 'UPDATE'] as ('INSERT' | 'UPDATE')[], // Don't listen to deletes
    onError: errorHandlers.logError('UserStables')
  })

  if (loading) return <div className="p-4">Loading your stables...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Stables ({userStables.length})</h2>
      {userStables.length === 0 ? (
        <p className="text-gray-600">No stables found</p>
      ) : (
        <div className="space-y-2">
          {userStables.map(stable => (
            <div key={stable.id} className="p-2 border rounded">
              <div className="font-semibold">{stable.name}</div>
              <div className="text-sm text-gray-600">
                {stable.city && `${stable.city} - `}{stable.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Example 3: Single record subscription
 */
export function StableDetails({ stableId }: { stableId: string }) {
  const { data: stable, loading, error, exists } = useSimpleRealtimeRecord('staller', stableId, {
    onError: errorHandlers.logError('StableDetails'),
    onDeleted: () => {
      console.log('Stable was deleted!')
      // In a real app, you might redirect or show a message
    }
  })

  if (loading) return <div className="p-4">Loading stable details...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!exists) return <div className="p-4 text-yellow-600">Stable not found</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{stable?.name}</h2>
      <div className="space-y-2">
        <div><strong>Location:</strong> {stable?.city} {stable?.address}</div>
        <div><strong>Description:</strong> {stable?.description}</div>
        <div><strong>Owner:</strong> {stable?.eier_navn}</div>
        <div><strong>County:</strong> {stable?.county}</div>
      </div>
    </div>
  )
}

/**
 * Example 4: Conversation messages with pattern
 */
export function ConversationMessages({ conversationId }: { conversationId: string }) {
  const { data: messages, loading, error, connected } = useSimpleRealtimeTable('messages', {
    ...patterns.conversationMessages(conversationId),
    onError: errorHandlers.logError('ConversationMessages')
  })

  if (loading) return <div className="p-4">Loading messages...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Messages ({messages.length})</h2>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={connected ? 'Connected' : 'Disconnected'} />
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className="p-2 border rounded">
            <div className="text-sm text-gray-600 mb-1">
              {message.opprettet_dato ? new Date(message.opprettet_dato).toLocaleTimeString() : 'Unknown time'}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 5: Connection status indicator
 */
export function RealtimeStatus() {
  const { connected, connecting, error, lastConnected } = useSimpleRealtimeStatus()

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Real-time Status</h3>
      <div className="space-y-1 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 
            connecting ? 'bg-yellow-500' : 
            'bg-red-500'
          }`} />
          <span>
            {connected ? 'Connected' : 
             connecting ? 'Connecting...' : 
             'Disconnected'}
          </span>
        </div>
        {error && (
          <div className="text-red-600">Error: {error}</div>
        )}
        {lastConnected && (
          <div className="text-gray-600">
            Last connected: {lastConnected.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Example 6: Combined dashboard
 */
export function SimpleRealtimeDashboard({ userId }: { userId: string }) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Simple Real-time Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <RealtimeStatus />
        </div>
        <div>
          <UserStables userId={userId} />
        </div>
      </div>
      
      <div>
        <SimpleStablesList />
      </div>
    </div>
  )
}

/**
 * Example usage in a page or component:
 * 
 * ```typescript
 * import { SimpleRealtimeDashboard } from '@/components/examples/SimpleRealtimeExamples'
 * 
 * export default function DashboardPage() {
 *   const { user } = useAuth()
 *   
 *   if (!user) return <div>Please log in</div>
 *   
 *   return <SimpleRealtimeDashboard userId={user.id} />
 * }
 * ```
 */