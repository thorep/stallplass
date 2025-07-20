'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { AdminNotification } from '@/hooks/useAdminNotifications';

interface AdminNotificationCenterProps {
  notifications: AdminNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
  onClearAll: () => void;
}

export function AdminNotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification,
  onClearAll
}: AdminNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Nå nettopp';
    if (minutes < 60) return `${minutes}m siden`;
    if (hours < 24) return `${hours}t siden`;
    return `${days}d siden`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900">
                Varsler ({unreadCount} uleste)
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Marker alle som lest
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Fjern alle
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>Ingen varsler</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-slate-100 ${
                    !notification.isRead ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-slate-50 transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="text-slate-400 hover:text-green-600"
                              title="Marker som lest"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveNotification(notification.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Fjern varsel"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Viser {notifications.length} varsler
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}