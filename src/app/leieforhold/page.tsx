'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LeieforholdPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/logg-inn');
      return;
    }

    if (!loading && user) {
      // Redirect to unified dashboard with rentals tab active
      router.replace('/dashboard?tab=rentals');
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Omdirigerer...</div>
    </div>
  );
}