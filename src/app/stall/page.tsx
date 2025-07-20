'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import StallClient from '@/components/organisms/StallClient';
import { StableWithBoxStats } from '@/types/stable';

export default function StallPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [stables, setStables] = useState<StableWithBoxStats[]>([]);
  const [stablesLoading, setStablesLoading] = useState(true);

  useEffect(() => {
    const fetchUserStables = async () => {
      try {
        setStablesLoading(true);
        const token = await getIdToken();
        const response = await fetch(`/api/stables?ownerId=${user?.id}&withBoxStats=true`, {
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
      fetchUserStables();
    }
  }, [user, loading, router, getIdToken]);

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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <StallClient stables={stables} />
      </main>
      <Footer />
    </div>
  );
}