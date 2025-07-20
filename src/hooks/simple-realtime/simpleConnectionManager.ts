import { supabase } from '@/lib/supabase'

/**
 * Simple connection manager for real-time subscriptions
 * Provides basic error handling and reconnection functionality
 */

// Simple connection state
interface SimpleConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  error: string | null
  lastConnected: Date | null
  reconnectAttempts: number
}

// Simple configuration
interface SimpleConnectionConfig {
  maxRetries: number
  retryDelay: number
  enableLogging: boolean
}

// Default configuration
const DEFAULT_CONFIG: SimpleConnectionConfig = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  enableLogging: process.env.NODE_ENV === 'development',
}

class SimpleConnectionManager {
  private state: SimpleConnectionState = {
    isConnected: false,
    isReconnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  }

  private config: SimpleConnectionConfig
  private listeners: Set<(state: SimpleConnectionState) => void> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<SimpleConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupRealtimeListeners()
  }

  /**
   * Get current connection state
   */
  getState(): SimpleConnectionState {
    return { ...this.state }
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: (state: SimpleConnectionState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call with current state
    listener(this.state)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Force a reconnection attempt
   */
  reconnect(): void {
    if (this.state.isReconnecting) {
      this.log('Already reconnecting, skipping')
      return
    }

    this.log('Manual reconnection requested')
    this.resetRetryCount()
    this.attemptReconnection()
  }

  /**
   * Reset connection state
   */
  reset(): void {
    this.log('Resetting connection manager')
    this.clearReconnectTimer()
    this.updateState({
      isConnected: false,
      isReconnecting: false,
      error: null,
      reconnectAttempts: 0,
    })
  }

  /**
   * Setup Supabase realtime listeners
   */
  private setupRealtimeListeners(): void {
    supabase.realtime.onOpen(() => {
      this.log('Real-time connection opened')
      this.updateState({
        isConnected: true,
        isReconnecting: false,
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 0,
      })
      this.clearReconnectTimer()
    })

    supabase.realtime.onClose(() => {
      this.log('Real-time connection closed')
      this.updateState({
        isConnected: false,
        isReconnecting: false,
      })
      this.attemptReconnection()
    })

    supabase.realtime.onError((error) => {
      this.log('Real-time connection error', error)
      this.updateState({
        isConnected: false,
        isReconnecting: false,
        error: error?.message || 'Unknown connection error',
      })
      this.attemptReconnection()
    })
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SimpleConnectionState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in connection state listener:', error)
      }
    })
  }

  /**
   * Attempt reconnection with retry logic
   */
  private attemptReconnection(): void {
    // Don't reconnect if already reconnecting or max retries exceeded
    if (this.state.isReconnecting || this.state.reconnectAttempts >= this.config.maxRetries) {
      if (this.state.reconnectAttempts >= this.config.maxRetries) {
        this.log(`Max reconnection attempts (${this.config.maxRetries}) reached`)
        this.updateState({
          error: `Connection failed after ${this.config.maxRetries} attempts`,
        })
      }
      return
    }

    this.updateState({
      isReconnecting: true,
      reconnectAttempts: this.state.reconnectAttempts + 1,
    })

    const delay = this.config.retryDelay * this.state.reconnectAttempts
    this.log(`Attempting reconnection in ${delay}ms (attempt ${this.state.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.performReconnection()
    }, delay)
  }

  /**
   * Perform the actual reconnection
   */
  private performReconnection(): void {
    try {
      this.log('Performing reconnection')
      
      // Disconnect and reconnect
      supabase.realtime.disconnect()
      setTimeout(() => {
        supabase.realtime.connect()
      }, 100)
      
    } catch (error) {
      this.log('Reconnection failed', error)
      this.updateState({
        isReconnecting: false,
        error: error instanceof Error ? error.message : 'Reconnection failed',
      })
      
      // Try again if under max retries
      if (this.state.reconnectAttempts < this.config.maxRetries) {
        setTimeout(() => this.attemptReconnection(), 1000)
      }
    }
  }

  /**
   * Reset retry count
   */
  private resetRetryCount(): void {
    this.updateState({ reconnectAttempts: 0 })
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
   * Log message if logging is enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.config.enableLogging) {
      console.log(`[SimpleConnectionManager] ${message}`, data || '')
    }
  }
}

// Export singleton instance
export const simpleConnectionManager = new SimpleConnectionManager()

// Export utility functions
export const connectionUtils = {
  /**
   * Check if currently connected
   */
  isConnected: () => simpleConnectionManager.getState().isConnected,
  
  /**
   * Check if currently reconnecting
   */
  isReconnecting: () => simpleConnectionManager.getState().isReconnecting,
  
  /**
   * Get connection error if any
   */
  getError: () => simpleConnectionManager.getState().error,
  
  /**
   * Get last connected time
   */
  getLastConnected: () => simpleConnectionManager.getState().lastConnected,
  
  /**
   * Force reconnection
   */
  reconnect: () => simpleConnectionManager.reconnect(),
  
  /**
   * Reset connection state
   */
  reset: () => simpleConnectionManager.reset(),
  
  /**
   * Subscribe to connection changes
   */
  subscribe: (callback: (state: SimpleConnectionState) => void) => 
    simpleConnectionManager.subscribe(callback),
}

// Export types
export type { SimpleConnectionState, SimpleConnectionConfig }