import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

// Connection status types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

export interface ConnectionState {
  status: ConnectionStatus
  isOnline: boolean
  lastConnected: Date | null
  reconnectAttempts: number
  error: string | null
}

export interface RealtimeConfig {
  // Connection settings
  maxReconnectAttempts: number
  reconnectDelay: number
  reconnectDelayMultiplier: number
  maxReconnectDelay: number
  
  // Performance settings
  batchUpdates: boolean
  batchDelay: number
  throttleInterval: number
  
  // Debugging
  enableLogging: boolean
}

// Default configuration
export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  maxReconnectAttempts: 10,
  reconnectDelay: 1000, // 1 second
  reconnectDelayMultiplier: 1.5,
  maxReconnectDelay: 30000, // 30 seconds
  batchUpdates: true,
  batchDelay: 100, // 100ms
  throttleInterval: 500, // 500ms
  enableLogging: process.env.NODE_ENV === 'development',
}

// Connection event types
export type ConnectionEvent = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

// Channel registry for tracking active subscriptions
interface ChannelRegistry {
  [channelId: string]: {
    channel: RealtimeChannel
    subscribers: number
    lastActivity: Date
    config: Partial<RealtimeConfig>
  }
}

/**
 * Central real-time connection manager for Supabase
 * Handles connection state, reconnection logic, and channel management
 */
class RealtimeConnectionManager {
  private config: RealtimeConfig
  private connectionState: ConnectionState
  private channelRegistry: ChannelRegistry = {}
  private eventListeners: Map<ConnectionEvent, Set<(state: ConnectionState) => void>> = new Map()
  private reconnectTimer: NodeJS.Timeout | null = null
  private isReconnecting = false

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = { ...DEFAULT_REALTIME_CONFIG, ...config }
    this.connectionState = {
      status: 'disconnected',
      isOnline: navigator?.onLine ?? true,
      lastConnected: null,
      reconnectAttempts: 0,
      error: null,
    }

    this.setupNetworkListeners()
    this.setupSupabaseListeners()
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Get current configuration
   */
  getConfig(): RealtimeConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.log('Configuration updated', newConfig)
  }

  /**
   * Add event listener for connection events
   */
  addEventListener(event: ConnectionEvent, listener: (state: ConnectionState) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(listener)
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: ConnectionEvent, listener: (state: ConnectionState) => void): void {
    this.eventListeners.get(event)?.delete(listener)
  }

  /**
   * Emit connection event
   */
  private emitEvent(event: ConnectionEvent): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(this.connectionState)
        } catch (error) {
          console.error('Error in connection event listener:', error)
        }
      })
    }
  }

  /**
   * Update connection state and emit events
   */
  private updateConnectionState(updates: Partial<ConnectionState>): void {
    const previousStatus = this.connectionState.status
    this.connectionState = { ...this.connectionState, ...updates }
    
    this.log('Connection state updated', this.connectionState)
    
    // Emit event if status changed
    if (previousStatus !== this.connectionState.status) {
      this.emitEvent(this.connectionState.status as ConnectionEvent)
    }
  }

  /**
   * Setup network online/offline listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.log('Network came online')
      this.updateConnectionState({ isOnline: true })
      this.attemptReconnection()
    })

    window.addEventListener('offline', () => {
      this.log('Network went offline')
      this.updateConnectionState({ 
        isOnline: false, 
        status: 'disconnected',
        error: 'Network offline'
      })
    })
  }

  /**
   * Setup Supabase realtime listeners
   */
  private setupSupabaseListeners(): void {
    // Note: Supabase realtime client connection events are handled internally
    // We'll manage connection state through channel subscription status instead
    this.log('Supabase realtime connection management initialized')
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    if (!this.connectionState.isOnline || this.isReconnecting) {
      return
    }

    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached')
      this.updateConnectionState({ 
        status: 'error',
        error: 'Max reconnection attempts exceeded'
      })
      return
    }

    this.isReconnecting = true
    this.updateConnectionState({ 
      status: 'reconnecting',
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    })

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.reconnectDelayMultiplier, this.connectionState.reconnectAttempts),
      this.config.maxReconnectDelay
    )

    this.log(`Attempting reconnection in ${delay}ms (attempt ${this.connectionState.reconnectAttempts + 1})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnect()
    }, delay)
  }

  /**
   * Force reconnection
   */
  private async reconnect(): Promise<void> {
    try {
      this.log('Attempting to reconnect to Supabase realtime')
      
      // Disconnect and reconnect
      supabase.realtime.disconnect()
      await new Promise(resolve => setTimeout(resolve, 100)) // Brief delay
      supabase.realtime.connect()
      
      this.isReconnecting = false
    } catch (error) {
      this.log('Reconnection failed', error)
      this.isReconnecting = false
      this.attemptReconnection()
    }
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Create or get existing channel
   */
  createChannel(
    channelId: string, 
    config: Partial<RealtimeConfig> = {}
  ): RealtimeChannel {
    // Check if channel already exists
    if (this.channelRegistry[channelId]) {
      this.channelRegistry[channelId].subscribers++
      this.channelRegistry[channelId].lastActivity = new Date()
      this.log(`Reusing existing channel: ${channelId}`)
      return this.channelRegistry[channelId].channel
    }

    // Create new channel
    const channel = supabase.channel(channelId)
    
    // Register channel
    this.channelRegistry[channelId] = {
      channel,
      subscribers: 1,
      lastActivity: new Date(),
      config: { ...this.config, ...config }
    }

    this.log(`Created new channel: ${channelId}`)
    return channel
  }

  /**
   * Remove channel subscription
   */
  removeChannel(channelId: string): void {
    const registration = this.channelRegistry[channelId]
    if (!registration) return

    registration.subscribers--
    registration.lastActivity = new Date()

    // If no more subscribers, unsubscribe and remove
    if (registration.subscribers <= 0) {
      registration.channel.unsubscribe()
      delete this.channelRegistry[channelId]
      this.log(`Removed channel: ${channelId}`)
    } else {
      this.log(`Decremented subscriber count for channel: ${channelId} (${registration.subscribers} remaining)`)
    }
  }

  /**
   * Get channel registry stats
   */
  getChannelStats(): {
    activeChannels: number
    totalSubscribers: number
    channels: Array<{
      id: string
      subscribers: number
      lastActivity: Date
    }>
  } {
    const channels = Object.entries(this.channelRegistry).map(([id, reg]) => ({
      id,
      subscribers: reg.subscribers,
      lastActivity: reg.lastActivity
    }))

    return {
      activeChannels: channels.length,
      totalSubscribers: channels.reduce((sum, ch) => sum + ch.subscribers, 0),
      channels
    }
  }

  /**
   * Cleanup old inactive channels
   */
  cleanupInactiveChannels(maxAge: number = 5 * 60 * 1000): void {
    const now = new Date()
    const channelsToRemove: string[] = []

    Object.entries(this.channelRegistry).forEach(([channelId, registration]) => {
      const age = now.getTime() - registration.lastActivity.getTime()
      if (age > maxAge && registration.subscribers === 0) {
        channelsToRemove.push(channelId)
      }
    })

    channelsToRemove.forEach(channelId => {
      this.channelRegistry[channelId].channel.unsubscribe()
      delete this.channelRegistry[channelId]
      this.log(`Cleaned up inactive channel: ${channelId}`)
    })

    if (channelsToRemove.length > 0) {
      this.log(`Cleaned up ${channelsToRemove.length} inactive channels`)
    }
  }

  /**
   * Disconnect all channels and cleanup
   */
  disconnect(): void {
    this.log('Disconnecting all channels')
    
    Object.entries(this.channelRegistry).forEach(([channelId, registration]) => {
      registration.channel.unsubscribe()
    })
    
    this.channelRegistry = {}
    this.clearReconnectTimer()
    this.eventListeners.clear()
    
    supabase.realtime.disconnect()
  }

  /**
   * Reset connection state and reconnect
   */
  reset(): void {
    this.log('Resetting connection manager')
    this.disconnect()
    this.updateConnectionState({
      status: 'disconnected',
      reconnectAttempts: 0,
      error: null,
    })
    supabase.realtime.connect()
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: unknown): void {
    if (this.config.enableLogging) {
      console.log(`[RealtimeManager] ${message}`, data || '')
    }
  }
}

// Global singleton instance
export const realtimeManager = new RealtimeConnectionManager()

// Export types and utilities
export type { RealtimeConnectionManager }