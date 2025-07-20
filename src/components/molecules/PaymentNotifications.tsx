'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { usePaymentTracking, PaymentUpdate } from '@/hooks/usePaymentTracking';
import { formatPrice, formatDate } from '@/utils/formatting';

interface PaymentNotificationsProps {
  userId?: string;
  isAdmin?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoHideDelay?: number; // milliseconds
  enableSound?: boolean;
}

interface NotificationItem extends PaymentUpdate {
  id: string;
  isRead: boolean;
  createdAt: Date;
}

export default function PaymentNotifications({
  userId,
  isAdmin = false,
  position = 'top-right',
  maxNotifications = 5,
  autoHideDelay = 10000,
  enableSound = true
}: PaymentNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use payment tracking for real-time updates
  const {
    recentUpdates,
    paymentStats,
    isLoading,
    error
  } = usePaymentTracking({
    enableRealtime: true,
    maxRecentActivity: 100,
    trackingTimeWindow: 24
  });

  // Convert payment updates to notifications
  useEffect(() => {
    if (recentUpdates.length === 0) return;

    const newNotifications = recentUpdates
      .filter(update => {
        // Filter based on user role and user ID
        if (!isAdmin && userId && update.userEmail) {
          // For regular users, only show their own payment notifications
          return update.userEmail === userId;
        }
        // For admins, show all notifications
        return isAdmin;
      })
      .slice(0, maxNotifications)
      .map(update => ({
        ...update,
        id: `${update.paymentId}-${update.timestamp.getTime()}`,
        isRead: false,
        createdAt: update.timestamp
      }));

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      
      if (uniqueNew.length > 0) {
        // Play notification sound
        if (enableSound && 'Audio' in window) {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Ignore audio play errors (user hasn't interacted with page yet)
            });
          } catch (error) {
            // Ignore audio errors
          }
        }

        const combined = [...uniqueNew, ...prev].slice(0, maxNotifications);
        return combined;
      }
      
      return prev;
    });
  }, [recentUpdates, isAdmin, userId, maxNotifications, enableSound]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  // Auto-hide notifications
  useEffect(() => {
    if (autoHideDelay <= 0) return;

    const timers = notifications.map(notification => {
      if (notification.isRead) return null;

      return setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }, autoHideDelay);
    });

    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
    };
  }, [notifications, autoHideDelay]);

  const getNotificationIcon = (status: PaymentUpdate['newStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'PROCESSING':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getNotificationMessage = (notification: NotificationItem) => {
    const { newStatus, amount, userEmail, stableName } = notification;
    
    switch (newStatus) {
      case 'COMPLETED':
        return isAdmin 
          ? `Betaling fullført: ${formatPrice(amount)} fra ${userEmail}`
          : `Din betaling på ${formatPrice(amount)} er fullført for ${stableName}`;
      case 'FAILED':
        return isAdmin
          ? `Betaling feilet: ${formatPrice(amount)} fra ${userEmail}`
          : `Din betaling på ${formatPrice(amount)} feilet for ${stableName}`;
      case 'CANCELLED':
        return isAdmin
          ? `Betaling kansellert: ${formatPrice(amount)} fra ${userEmail}`
          : `Din betaling på ${formatPrice(amount)} ble kansellert for ${stableName}`;
      case 'PROCESSING':
        return isAdmin
          ? `Behandler betaling: ${formatPrice(amount)} fra ${userEmail}`
          : `Behandler din betaling på ${formatPrice(amount)} for ${stableName}`;
      default:
        return isAdmin
          ? `Betalingsstatus oppdatert for ${userEmail}`
          : `Betalingsstatus oppdatert for ${stableName}`;
    }
  };

  const getNotificationColor = (status: PaymentUpdate['newStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-green-200 bg-green-50';
      case 'FAILED':
      case 'CANCELLED':
        return 'border-red-200 bg-red-50';
      case 'PROCESSING':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (isLoading || error) return null;

  return (
    <>
      {/* Notification Bell/Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`p-2 rounded-lg border transition-colors ${
            unreadCount > 0
              ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isVisible && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Betalingsvarslinger {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Merk alle som lest
                    </button>
                  )}
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Tøm alle
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length > 0 ? (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 mb-2 rounded-lg border ${getNotificationColor(notification.newStatus)} ${
                        notification.isRead ? 'opacity-60' : ''
                      } transition-opacity`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.newStatus)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(notification.createdAt.toISOString())}
                            </p>
                            {notification.failureReason && (
                              <p className="text-xs text-red-600 mt-1">
                                {notification.failureReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          Merk som lest
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Ingen nye betalingsvarslinger
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className={`fixed ${getPositionClasses()} z-50 space-y-2 pointer-events-none`}>
        {notifications
          .filter(n => !n.isRead)
          .slice(0, 3) // Show max 3 toast notifications
          .map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm w-full bg-white shadow-lg rounded-lg border ${getNotificationColor(notification.newStatus)} pointer-events-auto`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.newStatus)}
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Betalingsoppdatering
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {getNotificationMessage(notification)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}