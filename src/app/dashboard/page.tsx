'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import DashboardClient from '@/components/organisms/DashboardClient';
import { useUserStables } from '@/hooks/useQueries';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: stables = [], isLoading: stablesLoading } = useUserStables(user?.id || '');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/logg-inn');
      return;
    }
  }, [user, loading, router]);

  if (loading || stablesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <DashboardClient stables={stables} />
      </main>
      <Footer />
    </div>
  );
}