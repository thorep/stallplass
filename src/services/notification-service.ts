import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'

export type Payment = Tables<'payments'>

export interface StableOwnerNotification {
  id: string
  type: 'NEW_RENTAL_REQUEST' | 'RENTAL_CONFIRMED' | 'RENTAL_CANCELLED' | 'PAYMENT_RECEIVED' | 'NEW_MESSAGE' | 'REVIEW_RECEIVED'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: {
    rentalId?: string
    paymentId?: string
    conversationId?: string
    stableId?: string
    boxId?: string
    amount?: number
    renterName?: string
  }
}

export interface PaymentWithRelations extends Payment {
  stable: {
    id: string
    name: string
    owner_id: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Get payments for a stable owner's stables
 */
export async function getStableOwnerPayments(ownerId: string): Promise<PaymentWithRelations[]> {
  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      stable:stables!payments_stable_id_fkey (
        id,
        name,
        owner_id
      ),
      user:users!payments_user_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('stable.owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return payments as PaymentWithRelations[]
}

/**
 * Subscribe to payment updates for a stable owner
 */
export function subscribeToStableOwnerPayments(
  ownerId: string,
  onPaymentUpdate: (payment: Payment, eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-payments-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const payment = payload.new as Payment

          // Check if this payment is for one of the owner's stables
          if (payment.stable_id) {
            const { data: stable } = await supabase
              .from('stables')
              .select('owner_id')
              .eq('id', payment.stable_id)
              .single()

            if (stable?.owner_id === ownerId) {
              onPaymentUpdate(payment, payload.eventType as 'INSERT' | 'UPDATE')
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to conversations for stable owner (for message notifications)
 */
export function subscribeToStableOwnerConversations(
  ownerId: string,
  onConversationUpdate: (conversation: any, eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-conversations-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const conversation = payload.new

          // Check if this conversation is for one of the owner's stables
          if (conversation.stable_id) {
            const { data: stable } = await supabase
              .from('stables')
              .select('owner_id')
              .eq('id', conversation.stable_id)
              .single()

            if (stable?.owner_id === ownerId) {
              onConversationUpdate(conversation, payload.eventType as 'INSERT' | 'UPDATE')
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to new messages for stable owner's conversations
 */
export function subscribeToStableOwnerMessages(
  ownerId: string,
  onNewMessage: (message: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-messages-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      async (payload) => {
        const message = payload.new

        // Get the conversation to check if it belongs to this stable owner
        const { data: conversation } = await supabase
          .from('conversations')
          .select(`
            stable_id,
            stable:stables!conversations_stable_id_fkey (
              owner_id
            )
          `)
          .eq('id', message.conversation_id)
          .single()

        if (conversation?.stable?.owner_id === ownerId) {
          // Only notify if the message is not from the stable owner themselves
          if (message.sender_id !== ownerId) {
            onNewMessage(message)
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to box status changes for stable owner's boxes
 */
export function subscribeToStableOwnerBoxUpdates(
  ownerId: string,
  onBoxUpdate: (box: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-boxes-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      async (payload) => {
        const box = payload.new || payload.old

        // Check if this box belongs to one of the owner's stables
        if (box.stable_id) {
          const { data: stable } = await supabase
            .from('stables')
            .select('owner_id')
            .eq('id', box.stable_id)
            .single()

          if (stable?.owner_id === ownerId) {
            onBoxUpdate(box, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE')
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Create notification helpers
 */
export const NotificationHelpers = {
  /**
   * Format rental notification
   */
  formatRentalNotification(
    type: 'NEW_RENTAL_REQUEST' | 'RENTAL_CONFIRMED' | 'RENTAL_CANCELLED',
    renterName: string,
    stableName: string,
    boxName: string,
    amount?: number
  ): Omit<StableOwnerNotification, 'id' | 'timestamp' | 'read'> {
    const notifications = {
      NEW_RENTAL_REQUEST: {
        title: 'Ny leieforespørsel',
        message: `${renterName} har sendt en forespørsel om å leie ${boxName} i ${stableName}`,
        type: 'NEW_RENTAL_REQUEST' as const
      },
      RENTAL_CONFIRMED: {
        title: 'Leie bekreftet',
        message: `Leie av ${boxName} til ${renterName} er bekreftet (${amount ? `${amount} kr/mnd` : ''})`,
        type: 'RENTAL_CONFIRMED' as const
      },
      RENTAL_CANCELLED: {
        title: 'Leie avbrutt',
        message: `Leie av ${boxName} med ${renterName} har blitt avbrutt`,
        type: 'RENTAL_CANCELLED' as const
      }
    }

    return notifications[type]
  },

  /**
   * Format payment notification
   */
  formatPaymentNotification(
    amount: number,
    stableName: string,
    status: string
  ): Omit<StableOwnerNotification, 'id' | 'timestamp' | 'read'> {
    const statusText = status === 'COMPLETED' ? 'mottatt' : 'oppdatert'
    
    return {
      type: 'PAYMENT_RECEIVED',
      title: `Betaling ${statusText}`,
      message: `Betaling på ${amount} kr for ${stableName} er ${statusText}`
    }
  },

  /**
   * Format message notification
   */
  formatMessageNotification(
    senderName: string,
    stableName: string,
    preview: string
  ): Omit<StableOwnerNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'NEW_MESSAGE',
      title: 'Ny melding',
      message: `${senderName} sendte en melding om ${stableName}: "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"`
    }
  }
}

/**
 * Comprehensive notification manager for stable owners
 */
export class StableOwnerNotificationManager {
  private channels: RealtimeChannel[] = []
  private notifications: StableOwnerNotification[] = []
  private onNotificationCallbacks: ((notification: StableOwnerNotification) => void)[] = []

  constructor(private ownerId: string) {}

  /**
   * Start all real-time subscriptions
   */
  startSubscriptions() {
    // Subscribe to rental changes
    const rentalChannel = subscribeToStableOwnerPayments(
      this.ownerId,
      this.handlePaymentUpdate.bind(this)
    )
    this.channels.push(rentalChannel)

    // Subscribe to conversation updates
    const conversationChannel = subscribeToStableOwnerConversations(
      this.ownerId,
      this.handleConversationUpdate.bind(this)
    )
    this.channels.push(conversationChannel)

    // Subscribe to new messages
    const messageChannel = subscribeToStableOwnerMessages(
      this.ownerId,
      this.handleNewMessage.bind(this)
    )
    this.channels.push(messageChannel)

    // Subscribe to box updates
    const boxChannel = subscribeToStableOwnerBoxUpdates(
      this.ownerId,
      this.handleBoxUpdate.bind(this)
    )
    this.channels.push(boxChannel)
  }

  /**
   * Stop all subscriptions
   */
  stopSubscriptions() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.channels = []
  }

  /**
   * Add notification callback
   */
  onNotification(callback: (notification: StableOwnerNotification) => void) {
    this.onNotificationCallbacks.push(callback)
  }

  /**
   * Add a notification
   */
  private addNotification(notification: Omit<StableOwnerNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: StableOwnerNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    
    // Trigger callbacks
    this.onNotificationCallbacks.forEach(callback => {
      callback(newNotification)
    })
  }

  /**
   * Handle payment updates
   */
  private async handlePaymentUpdate(payment: Payment, eventType: 'INSERT' | 'UPDATE') {
    if (eventType === 'UPDATE' && payment.status === 'COMPLETED') {
      // Get stable name
      const { data: stable } = await supabase
        .from('stables')
        .select('name')
        .eq('id', payment.stable_id)
        .single()

      if (stable) {
        const notification = NotificationHelpers.formatPaymentNotification(
          payment.total_amount,
          stable.name,
          payment.status || 'UNKNOWN'
        )
        
        this.addNotification({
          ...notification,
          data: {
            paymentId: payment.id,
            stableId: payment.stable_id,
            amount: payment.total_amount
          }
        })
      }
    }
  }

  /**
   * Handle conversation updates
   */
  private handleConversationUpdate(conversation: any, eventType: 'INSERT' | 'UPDATE') {
    // Handle conversation status changes if needed
    if (eventType === 'UPDATE' && conversation.status) {
      // Add logic for conversation status notifications if needed
    }
  }

  /**
   * Handle new messages
   */
  private async handleNewMessage(message: any) {
    // Get conversation and stable details
    const { data: conversation } = await supabase
      .from('conversations')
      .select(`
        stable:stables!conversations_stable_id_fkey (
          name
        )
      `)
      .eq('id', message.conversation_id)
      .single()

    // Get sender details
    const { data: sender } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', message.sender_id)
      .single()

    if (conversation && sender) {
      const notification = NotificationHelpers.formatMessageNotification(
        sender.name || sender.email,
        conversation.stable.name,
        message.content
      )
      
      this.addNotification({
        ...notification,
        data: {
          conversationId: message.conversation_id,
          stableId: conversation.stable_id
        }
      })
    }
  }

  /**
   * Handle box updates
   */
  private handleBoxUpdate(box: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') {
    // Add box status notifications if needed
    // This could include availability changes, price updates, etc.
  }

  /**
   * Get all notifications
   */
  getNotifications(): StableOwnerNotification[] {
    return this.notifications
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = []
  }
}

/**
 * Unsubscribe from a notification channel
 */
export function unsubscribeFromNotificationChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}