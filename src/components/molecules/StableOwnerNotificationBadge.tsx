'use client';

import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function StableOwnerNotificationBadge() {
  const { user } = useAuth();
  const router = useRouter();

  // Only show for authenticated users
  if (!user) return null;

  const handleClick = () => {
    // Navigate to profile page - simple click handler
    router.push('/profil');
  };

  return (
    <button 
      onClick={handleClick}
      className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
    >
      <BellIcon className="h-6 w-6" />
    </button>
  );
}