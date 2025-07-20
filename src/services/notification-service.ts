import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'
import {
  subscribeToStableOwnerRentals,
  subscribeToRentalStatusChanges,
  subscribeToNewRentalRequests,
  unsubscribeFromRentalChannel
} from '@/services/rental-service'

export type Payment = Tables<'payments'>

export interface StableOwnerNotification {
  id: string
  type: 'NEW_RENTAL_REQUEST' | 'RENTAL_CONFIRMED' | 'RENTAL_CANCELLED' | 'RENTAL_ACTIVE' | 'RENTAL_COMPLETED' | 'RENTAL_CONFLICT' | 'PAYMENT_RECEIVED' | 'NEW_MESSAGE' | 'REVIEW_RECEIVED'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'RENTAL' | 'PAYMENT' | 'MESSAGE' | 'REVIEW' | 'SYSTEM'
  data?: {
    rentalId?: string
    paymentId?: string
    conversationId?: string
    stableId?: string
    boxId?: string
    amount?: number
    renterName?: string
    conflictType?: string
    actionRequired?: boolean
  }
}

export interface RenterNotification {
  id: string
  type: 'RENTAL_REQUEST_SENT' | 'RENTAL_CONFIRMED' | 'RENTAL_REJECTED' | 'RENTAL_ACTIVE' | 'RENTAL_ENDING_SOON' | 'RENTAL_COMPLETED' | 'PAYMENT_DUE' | 'PAYMENT_CONFIRMED' | 'NEW_MESSAGE'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'RENTAL' | 'PAYMENT' | 'MESSAGE' | 'SYSTEM'
  data?: {
    rentalId?: string
    paymentId?: string
    conversationId?: string
    stableId?: string
    boxId?: string
    amount?: number
    stableName?: string
    boxName?: string
    dueDate?: string
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
 * Enhanced notification helpers for comprehensive rental management
 */
export const NotificationHelpers = {
  /**
   * Format rental notification for stable owners
   */
  formatStableOwnerRentalNotification(
    type: 'NEW_RENTAL_REQUEST' | 'RENTAL_CONFIRMED' | 'RENTAL_CANCELLED' | 'RENTAL_ACTIVE' | 'RENTAL_COMPLETED' | 'RENTAL_CONFLICT',
    renterName: string,
    stableName: string,
    boxName: string,
    amount?: number,
    conflictType?: string
  ): Omit<StableOwnerNotification, 'id' | 'timestamp' | 'read'> {
    const notifications = {
      NEW_RENTAL_REQUEST: {
        title: 'Ny leieforespørsel',
        message: `${renterName} har sendt en forespørsel om å leie ${boxName} i ${stableName}`,
        type: 'NEW_RENTAL_REQUEST' as const,
        priority: 'HIGH' as const,
        category: 'RENTAL' as const,
        data: { actionRequired: true }
      },
      RENTAL_CONFIRMED: {
        title: 'Leie bekreftet',
        message: `Leie av ${boxName} til ${renterName} er bekreftet (${amount ? `${amount} kr/mnd` : ''})`,
        type: 'RENTAL_CONFIRMED' as const,
        priority: 'MEDIUM' as const,
        category: 'RENTAL' as const
      },
      RENTAL_CANCELLED: {
        title: 'Leie avbrutt',
        message: `Leie av ${boxName} med ${renterName} har blitt avbrutt`,
        type: 'RENTAL_CANCELLED' as const,
        priority: 'MEDIUM' as const,
        category: 'RENTAL' as const
      },
      RENTAL_ACTIVE: {
        title: 'Leie aktivert',
        message: `Leieforholdet med ${renterName} for ${boxName} er nå aktivt`,
        type: 'RENTAL_ACTIVE' as const,
        priority: 'LOW' as const,
        category: 'RENTAL' as const
      },
      RENTAL_COMPLETED: {
        title: 'Leie fullført',
        message: `Leieforholdet med ${renterName} for ${boxName} er fullført`,
        type: 'RENTAL_COMPLETED' as const,
        priority: 'LOW' as const,
        category: 'RENTAL' as const
      },
      RENTAL_CONFLICT: {
        title: 'Leiekonflikt oppdaget',
        message: `${conflictType} oppdaget for ${boxName} - handling påkrevd`,
        type: 'RENTAL_CONFLICT' as const,
        priority: 'URGENT' as const,
        category: 'RENTAL' as const,
        data: { actionRequired: true, conflictType }
      }
    }

    return notifications[type]
  },

  /**
   * Format rental notification for renters
   */
  formatRenterNotification(
    type: 'RENTAL_REQUEST_SENT' | 'RENTAL_CONFIRMED' | 'RENTAL_REJECTED' | 'RENTAL_ACTIVE' | 'RENTAL_ENDING_SOON' | 'RENTAL_COMPLETED' | 'PAYMENT_DUE' | 'PAYMENT_CONFIRMED',
    stableName: string,
    boxName: string,
    amount?: number,
    dueDate?: string
  ): Omit<RenterNotification, 'id' | 'timestamp' | 'read'> {
    const notifications = {
      RENTAL_REQUEST_SENT: {
        title: 'Leieforespørsel sendt',
        message: `Din forespørsel om å leie ${boxName} i ${stableName} er sendt`,
        type: 'RENTAL_REQUEST_SENT' as const,
        priority: 'LOW' as const,
        category: 'RENTAL' as const
      },
      RENTAL_CONFIRMED: {
        title: 'Leie bekreftet!',
        message: `Din leie av ${boxName} i ${stableName} er bekreftet (${amount ? `${amount} kr/mnd` : ''})`,
        type: 'RENTAL_CONFIRMED' as const,
        priority: 'HIGH' as const,
        category: 'RENTAL' as const
      },
      RENTAL_REJECTED: {
        title: 'Leieforespørsel avslått',
        message: `Din forespørsel om å leie ${boxName} i ${stableName} ble dessverre avslått`,
        type: 'RENTAL_REJECTED' as const,
        priority: 'MEDIUM' as const,
        category: 'RENTAL' as const
      },
      RENTAL_ACTIVE: {
        title: 'Leie startet',
        message: `Ditt leieforhold for ${boxName} i ${stableName} er nå aktivt`,
        type: 'RENTAL_ACTIVE' as const,
        priority: 'MEDIUM' as const,
        category: 'RENTAL' as const
      },
      RENTAL_ENDING_SOON: {
        title: 'Leie utløper snart',
        message: `Ditt leieforhold for ${boxName} i ${stableName} utløper ${dueDate}`,
        type: 'RENTAL_ENDING_SOON' as const,
        priority: 'HIGH' as const,
        category: 'RENTAL' as const
      },
      RENTAL_COMPLETED: {
        title: 'Leie fullført',
        message: `Ditt leieforhold for ${boxName} i ${stableName} er fullført`,
        type: 'RENTAL_COMPLETED' as const,
        priority: 'LOW' as const,
        category: 'RENTAL' as const
      },
      PAYMENT_DUE: {
        title: 'Betaling forfaller',
        message: `Betaling på ${amount} kr for ${boxName} forfaller ${dueDate}`,
        type: 'PAYMENT_DUE' as const,
        priority: 'URGENT' as const,
        category: 'PAYMENT' as const
      },
      PAYMENT_CONFIRMED: {
        title: 'Betaling bekreftet',
        message: `Din betaling på ${amount} kr for ${boxName} er bekreftet`,
        type: 'PAYMENT_CONFIRMED' as const,
        priority: 'LOW' as const,
        category: 'PAYMENT' as const
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
      message: `Betaling på ${amount} kr for ${stableName} er ${statusText}`,
      priority: status === 'COMPLETED' ? 'MEDIUM' : 'LOW',
      category: 'PAYMENT'
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
      message: `${senderName} sendte en melding om ${stableName}: "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"`,
      priority: 'MEDIUM',
      category: 'MESSAGE'
    }
  }
}

/**
 * Comprehensive notification manager for stable owners with enhanced rental notifications
 */
export class StableOwnerNotificationManager {
  private channels: RealtimeChannel[] = []
  private notifications: StableOwnerNotification[] = []
  private onNotificationCallbacks: ((notification: StableOwnerNotification) => void)[] = []

  constructor(private ownerId: string) {}

  /**
   * Start all real-time subscriptions including enhanced rental notifications
   */
  startSubscriptions() {
    // Subscribe to payment changes
    const paymentChannel = subscribeToStableOwnerPayments(
      this.ownerId,
      this.handlePaymentUpdate.bind(this)
    )
    this.channels.push(paymentChannel)

    // Subscribe to rental changes - NEW
    const rentalChannel = subscribeToStableOwnerRentals(
      this.ownerId,
      this.handleRentalUpdate.bind(this)
    )
    this.channels.push(rentalChannel)

    // Subscribe to new rental requests - NEW
    const requestChannel = subscribeToNewRentalRequests(
      this.ownerId,
      this.handleNewRentalRequest.bind(this)
    )
    this.channels.push(requestChannel)

    // Subscribe to rental status changes - NEW
    const statusChannel = subscribeToRentalStatusChanges(
      this.handleRentalStatusChange.bind(this)
    )
    this.channels.push(statusChannel)

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
   * Handle rental updates
   */
  private async handleRentalUpdate(rental: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') {
    if (eventType === 'UPDATE' && rental.status) {
      // Get rental details
      const { data: rentalData } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            name
          ),
          box:boxes!rentals_box_id_fkey (
            name
          ),
          rider:users!rentals_rider_id_fkey (
            name,
            email
          )
        `)
        .eq('id', rental.id)
        .single()

      if (rentalData) {
        let notificationType: 'RENTAL_CONFIRMED' | 'RENTAL_CANCELLED' | 'RENTAL_ACTIVE' | 'RENTAL_COMPLETED' | null = null
        
        switch (rental.status) {
          case 'CONFIRMED':
            notificationType = 'RENTAL_CONFIRMED'
            break
          case 'CANCELLED':
            notificationType = 'RENTAL_CANCELLED'
            break
          case 'ACTIVE':
            notificationType = 'RENTAL_ACTIVE'
            break
          case 'COMPLETED':
            notificationType = 'RENTAL_COMPLETED'
            break
        }

        if (notificationType) {
          const notification = NotificationHelpers.formatStableOwnerRentalNotification(
            notificationType,
            rentalData.rider.name || rentalData.rider.email,
            rentalData.stable.name,
            rentalData.box.name,
            rentalData.monthly_price
          )
          
          this.addNotification({
            ...notification,
            data: {
              ...notification.data,
              rentalId: rental.id,
              stableId: rentalData.stable_id,
              boxId: rentalData.box_id,
              renterName: rentalData.rider.name || rentalData.rider.email,
              amount: rentalData.monthly_price
            }
          })
        }
      }
    }
  }

  /**
   * Handle new rental requests
   */
  private async handleNewRentalRequest(rental: any) {
    const notification = NotificationHelpers.formatStableOwnerRentalNotification(
      'NEW_RENTAL_REQUEST',
      rental.rider.name || rental.rider.email,
      rental.stable.name,
      rental.box.name,
      rental.monthly_price
    )
    
    this.addNotification({
      ...notification,
      data: {
        ...notification.data,
        rentalId: rental.id,
        stableId: rental.stable_id,
        boxId: rental.box_id,
        renterName: rental.rider.name || rental.rider.email,
        amount: rental.monthly_price
      }
    })
  }

  /**
   * Handle rental status changes (for conflict detection)
   */
  private async handleRentalStatusChange(rental: any) {
    // Check for potential conflicts when rental becomes active
    if (rental.status === 'ACTIVE') {
      const { data: conflictingRentals } = await supabase
        .from('rentals')
        .select('id, rider_id')
        .eq('box_id', rental.box_id)
        .eq('status', 'ACTIVE')
        .neq('id', rental.id)

      if (conflictingRentals && conflictingRentals.length > 0) {
        // Get box and stable info
        const { data: boxData } = await supabase
          .from('boxes')
          .select(`
            name,
            stable:stables!boxes_stable_id_fkey (
              name
            )
          `)
          .eq('id', rental.box_id)
          .single()

        if (boxData) {
          const notification = NotificationHelpers.formatStableOwnerRentalNotification(
            'RENTAL_CONFLICT',
            'System',
            boxData.stable.name,
            boxData.name,
            undefined,
            'Dobbeltbooking'
          )
          
          this.addNotification({
            ...notification,
            data: {
              ...notification.data,
              rentalId: rental.id,
              boxId: rental.box_id,
              conflictType: 'Dobbeltbooking'
            }
          })
        }
      }
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
   * Get notifications by category
   */
  getNotificationsByCategory(category: 'RENTAL' | 'PAYMENT' | 'MESSAGE' | 'REVIEW' | 'SYSTEM'): StableOwnerNotification[] {
    return this.notifications.filter(n => n.category === category)
  }

  /**
   * Get notifications by priority
   */
  getNotificationsByPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): StableOwnerNotification[] {
    return this.notifications.filter(n => n.priority === priority)
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  /**
   * Get urgent notifications
   */
  getUrgentNotifications(): StableOwnerNotification[] {
    return this.notifications.filter(n => n.priority === 'URGENT' && !n.read)
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

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
  }

  /**
   * Remove notification
   */
  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
  }

  /**
   * Get action required notifications
   */
  getActionRequiredNotifications(): StableOwnerNotification[] {
    return this.notifications.filter(n => n.data?.actionRequired && !n.read)
  }
}

/**
 * Renter notification manager
 */
export class RenterNotificationManager {
  private channels: RealtimeChannel[] = []
  private notifications: RenterNotification[] = []
  private onNotificationCallbacks: ((notification: RenterNotification) => void)[] = []

  constructor(private riderId: string) {}

  /**
   * Start real-time subscriptions for renter
   */
  startSubscriptions() {
    // Subscribe to rental changes for this renter
    const rentalChannel = supabase
      .channel(`renter-rentals-${this.riderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rentals',
          filter: `rider_id=eq.${this.riderId}`
        },
        this.handleRentalUpdate.bind(this)
      )
      .subscribe()
    
    this.channels.push(rentalChannel)

    // Subscribe to payments for renter's rentals
    const paymentChannel = supabase
      .channel(`renter-payments-${this.riderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${this.riderId}`
        },
        this.handlePaymentUpdate.bind(this)
      )
      .subscribe()
    
    this.channels.push(paymentChannel)
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
  onNotification(callback: (notification: RenterNotification) => void) {
    this.onNotificationCallbacks.push(callback)
  }

  /**
   * Add a notification
   */
  private addNotification(notification: Omit<RenterNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: RenterNotification = {
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
   * Handle rental updates for renter
   */
  private async handleRentalUpdate(payload: any) {
    const rental = payload.new || payload.old
    
    if (payload.eventType === 'INSERT') {
      // Get rental details
      const { data: rentalData } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            name
          ),
          box:boxes!rentals_box_id_fkey (
            name
          )
        `)
        .eq('id', rental.id)
        .single()

      if (rentalData) {
        const notification = NotificationHelpers.formatRenterNotification(
          'RENTAL_REQUEST_SENT',
          rentalData.stable.name,
          rentalData.box.name,
          rentalData.monthly_price
        )
        
        this.addNotification({
          ...notification,
          data: {
            rentalId: rental.id,
            stableId: rentalData.stable_id,
            boxId: rentalData.box_id,
            stableName: rentalData.stable.name,
            boxName: rentalData.box.name,
            amount: rentalData.monthly_price
          }
        })
      }
    } else if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
      // Status change
      const { data: rentalData } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            name
          ),
          box:boxes!rentals_box_id_fkey (
            name
          )
        `)
        .eq('id', rental.id)
        .single()

      if (rentalData) {
        let notificationType: 'RENTAL_CONFIRMED' | 'RENTAL_REJECTED' | 'RENTAL_ACTIVE' | 'RENTAL_COMPLETED' | null = null
        
        switch (rental.status) {
          case 'CONFIRMED':
            notificationType = 'RENTAL_CONFIRMED'
            break
          case 'CANCELLED':
            notificationType = 'RENTAL_REJECTED'
            break
          case 'ACTIVE':
            notificationType = 'RENTAL_ACTIVE'
            break
          case 'COMPLETED':
            notificationType = 'RENTAL_COMPLETED'
            break
        }

        if (notificationType) {
          const notification = NotificationHelpers.formatRenterNotification(
            notificationType,
            rentalData.stable.name,
            rentalData.box.name,
            rentalData.monthly_price
          )
          
          this.addNotification({
            ...notification,
            data: {
              rentalId: rental.id,
              stableId: rentalData.stable_id,
              boxId: rentalData.box_id,
              stableName: rentalData.stable.name,
              boxName: rentalData.box.name,
              amount: rentalData.monthly_price
            }
          })
        }
      }
    }
  }

  /**
   * Handle payment updates for renter
   */
  private async handlePaymentUpdate(payload: any) {
    const payment = payload.new || payload.old
    
    if (payload.eventType === 'UPDATE' && payment.status === 'COMPLETED') {
      // Get stable info
      const { data: stable } = await supabase
        .from('stables')
        .select('name')
        .eq('id', payment.stable_id)
        .single()

      if (stable) {
        const notification = NotificationHelpers.formatRenterNotification(
          'PAYMENT_CONFIRMED',
          stable.name,
          'N/A', // Box name not available in payment
          payment.total_amount
        )
        
        this.addNotification({
          ...notification,
          data: {
            paymentId: payment.id,
            stableId: payment.stable_id,
            amount: payment.total_amount,
            stableName: stable.name
          }
        })
      }
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): RenterNotification[] {
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
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  /**
   * Clear notifications
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