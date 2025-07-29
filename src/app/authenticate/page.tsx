'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthenticatePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      try {
        // Force refresh the session to sync with server cookies
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.user) {
          router.push('/dashboard');
        } else {
          router.push('/logg-inn');
        }
      } catch {
        router.push('/logg-inn');
      }
    };

    // Add a small delay to ensure cookies are set
    const timer = setTimeout(checkAuth, 200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}