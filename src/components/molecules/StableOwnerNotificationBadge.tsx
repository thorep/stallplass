'use client';

import { Fragment } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { Menu, Transition } from '@headlessui/react';
import { useStableOwnerNotifications } from '@/hooks/useStableOwnerRealTime';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function StableOwnerNotificationBadge() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useStableOwnerNotifications();

  // Only show for authenticated users
  if (!user) return null;

  const recentNotifications = notifications.slice(0, 5); // Show last 5 notifications

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Navigate to profile notifications tab
    router.push('/profil?tab=notifications');
  };

  const handleViewAll = () => {
    router.push('/profil?tab=notifications');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-indigo-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Varslinger</h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} nye
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">Ingen varslinger ennå</p>
              </div>
            ) : (
              <div className="py-2">
                {recentNotifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-b-0 transition-colors ${
                          active ? 'bg-slate-50' : ''
                        } ${!notification.read ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read ? 'bg-indigo-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-slate-900 truncate">
                                {notification.title}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                                notification.type === 'NEW_RENTAL_REQUEST'
                                  ? 'bg-green-100 text-green-700'
                                  : notification.type === 'PAYMENT_RECEIVED'
                                  ? 'bg-blue-100 text-blue-700'
                                  : notification.type === 'NEW_MESSAGE'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {notification.type === 'NEW_RENTAL_REQUEST' && 'Leie'}
                                {notification.type === 'PAYMENT_RECEIVED' && 'Betaling'}
                                {notification.type === 'NEW_MESSAGE' && 'Melding'}
                                {notification.type === 'RENTAL_CONFIRMED' && 'Bekreftet'}
                                {notification.type === 'RENTAL_CANCELLED' && 'Avbrutt'}
                                {notification.type === 'REVIEW_RECEIVED' && 'Anmeldelse'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {notification.timestamp.toLocaleString('nb-NO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Se alle varslinger
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}