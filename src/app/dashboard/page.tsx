'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import DashboardClient from '@/components/organisms/DashboardClient';
import { StableWithBoxStats } from '@/types/stable';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stables, setStables] = useState<StableWithBoxStats[]>([]);
  const [stablesLoading, setStablesLoading] = useState(true);

  useEffect(() => {
    const fetchUserStables = async () => {
      try {
        setStablesLoading(true);
        const token = await user?.getIdToken();
        const response = await fetch(`/api/stables?ownerId=${user?.uid}&withBoxStats=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStables(data);
        }
      } catch (error) {
        console.error('Error fetching stables:', error);
      } finally {
        setStablesLoading(false);
      }
    };

    if (!loading && !user) {
      router.push('/logg-inn');
      return;
    }

    if (user) {
      // Fetch user's stables
      fetchUserStables();
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