import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

type User = Tables<'users'>;
type Payment = Tables<'payments'>;
type Stable = Tables<'stables'>;
type Box = Tables<'boxes'>;

export type NotificationType = 
  | 'user_registered' 
  | 'payment_completed' 
  | 'payment_failed' 
  | 'high_value_payment'
  | 'stable_created' 
  | 'stable_featured'
  | 'box_created'
  | 'admin_activity'
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  data?: Record<string, unknown>; // Additional context data
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

interface UseAdminNotificationsOptions {
  enableRealtime?: boolean;
  maxNotifications?: number;
  enableSound?: boolean;
  priorityFilter?: NotificationPriority[];
}

export function useAdminNotifications(options: UseAdminNotificationsOptions = {}) {
  const { 
    enableRealtime = true, 
    maxNotifications = 50,
    enableSound = false,
    priorityFilter = ['medium', 'high', 'urgent']
  } = options;
  
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const notificationIdCounter = useRef(0);

  // Create a new notification
  const createNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, unknown>,
    actions?: NotificationAction[]
  ): AdminNotification => {
    return {
      id: `notification-${Date.now()}-${++notificationIdCounter.current}`,
      type,
      priority,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      data,
      actions
    };
  }, []);

  // Add notification to list
  const addNotification = useCallback((notification: AdminNotification) => {
    // Check if priority matches filter
    if (!priorityFilter.includes(notification.priority)) {
      return;
    }

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Play sound if enabled and high priority
    if (enableSound && (notification.priority === 'high' || notification.priority === 'urgent')) {
      // You can implement sound notification here
      console.log('🔔 High priority notification:', notification.title);
    }
  }, [priorityFilter, maxNotifications, enableSound]);

  // Process new user registration
  const handleUserRegistration = useCallback((user: User) => {
    const notification = createNotification(
      'user_registered',
      'Ny bruker registrert',
      `${user.name || user.email} har opprettet en konto`,
      'medium',
      { userId: user.id, email: user.email },
      [
        { label: 'Se profil', action: 'view_user', style: 'primary' },
        { label: 'Send velkomst', action: 'send_welcome', style: 'secondary' }
      ]
    );
    addNotification(notification);
  }, [createNotification, addNotification]);

  // Process payment updates
  const handlePaymentUpdate = useCallback((payment: Payment) => {
    let notification: AdminNotification | null = null;

    if (payment.status === 'COMPLETED') {
      const isHighValue = (payment.total_amount || 0) >= 1000;
      notification = createNotification(
        isHighValue ? 'high_value_payment' : 'payment_completed',
        isHighValue ? 'Høy verdi betaling fullført!' : 'Betaling fullført',
        `Betaling på ${payment.total_amount || 0} kr ${isHighValue ? '(høy verdi)' : ''} er fullført`,
        isHighValue ? 'high' : 'medium',
        { paymentId: payment.id, amount: payment.total_amount },
        [
          { label: 'Se detaljer', action: 'view_payment', style: 'primary' }
        ]
      );
    } else if (payment.status === 'FAILED') {
      notification = createNotification(
        'payment_failed',
        'Betaling feilet',
        `Betaling på ${payment.total_amount || 0} kr feilet${payment.failure_reason ? `: ${payment.failure_reason}` : ''}`,
        'high',
        { paymentId: payment.id, failureReason: payment.failure_reason },
        [
          { label: 'Se detaljer', action: 'view_payment', style: 'primary' },
          { label: 'Kontakt kunde', action: 'contact_user', style: 'secondary' }
        ]
      );
    }

    if (notification) {
      addNotification(notification);
    }
  }, [createNotification, addNotification]);

  // Process stable updates
  const handleStableUpdate = useCallback((stable: Stable, isNew: boolean = false) => {
    if (isNew) {
      const notification = createNotification(
        'stable_created',
        'Ny stall opprettet',
        `"${stable.name}" har blitt opprettet i ${stable.city || stable.county || 'ukjent område'}`,
        'medium',
        { stableId: stable.id, stableName: stable.name },
        [
          { label: 'Se stall', action: 'view_stable', style: 'primary' }
        ]
      );
      addNotification(notification);
    } else if (stable.featured) {
      const notification = createNotification(
        'stable_featured',
        'Stall fremhevet',
        `"${stable.name}" er nå fremhevet`,
        'medium',
        { stableId: stable.id, stableName: stable.name },
        [
          { label: 'Se stall', action: 'view_stable', style: 'primary' }
        ]
      );
      addNotification(notification);
    }
  }, [createNotification, addNotification]);

  // Process box updates
  const handleBoxUpdate = useCallback((box: Box, isNew: boolean = false) => {
    if (isNew) {
      const notification = createNotification(
        'box_created',
        'Ny boks opprettet',
        `Ny boks "${box.name}" er tilgjengelig`,
        'low',
        { boxId: box.id, boxName: box.name },
        [
          { label: 'Se boks', action: 'view_box', style: 'primary' }
        ]
      );
      addNotification(notification);
    }
  }, [createNotification, addNotification]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const setupSubscriptions = () => {
      // Subscribe to user changes
      const usersChannel = supabase
        .channel('admin-notifications-users')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'users'
          },
          (payload) => {
            const newUser = payload.new as User;
            handleUserRegistration(newUser);
          }
        )
        .subscribe();

      // Subscribe to payment changes
      const paymentsChannel = supabase
        .channel('admin-notifications-payments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          (payload) => {
            const payment = payload.new as Payment;
            handlePaymentUpdate(payment);
          }
        )
        .subscribe();

      // Subscribe to stable changes
      const stablesChannel = supabase
        .channel('admin-notifications-stables')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stables'
          },
          (payload) => {
            const stable = payload.new as Stable;
            const isNew = payload.eventType === 'INSERT';
            handleStableUpdate(stable, isNew);
          }
        )
        .subscribe();

      // Subscribe to box changes
      const boxesChannel = supabase
        .channel('admin-notifications-boxes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'boxes'
          },
          (payload) => {
            const box = payload.new as Box;
            handleBoxUpdate(box, true);
          }
        )
        .subscribe();

      channelsRef.current = [usersChannel, paymentsChannel, stablesChannel, boxesChannel];
    };

    setupSubscriptions();

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [enableRealtime, handleUserRegistration, handlePaymentUpdate, handleStableUpdate, handleBoxUpdate]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notifications.filter(notification => notification.priority === priority);
  }, [notifications]);

  // Create system alert manually
  const createSystemAlert = useCallback((
    title: string, 
    message: string, 
    priority: NotificationPriority = 'high',
    actions?: NotificationAction[]
  ) => {
    const notification = createNotification(
      'system_alert',
      title,
      message,
      priority,
      { manual: true },
      actions
    );
    addNotification(notification);
  }, [createNotification, addNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    createSystemAlert,
    clearError: () => setError(null)
  };
}