'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { AdminProvider } from '@/lib/admin-context';
import { 
  useAdminRoadmapItems,
  useAdminBasePrice,
  useAdminDiscounts,
  useAdminStableAmenities,
  useAdminBoxAmenities,
  useAdminUsers,
  useAdminStables,
  useAdminBoxes,
  useAdminPayments
} from '@/hooks/useAdminQueries';
import { useCurrentUser } from '@/hooks/useChat';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { User } from '@/types';

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Get current user data (including admin status)
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.user as User | null;
  const userLoading = currentUserQuery.isLoading;
  
  // Only fetch admin data if user is authenticated and is admin
  const {
    data: roadmapItems,
    isLoading: roadmapLoading,
  } = useAdminRoadmapItems();
  
  const {
    data: basePrice,
    isLoading: basePriceLoading,
  } = useAdminBasePrice();
  
  const {
    data: discounts,
    isLoading: discountsLoading,
  } = useAdminDiscounts();
  
  const {
    data: stableAmenities,
    isLoading: stableAmenitiesLoading,
  } = useAdminStableAmenities();
  
  const {
    data: boxAmenities,
    isLoading: boxAmenitiesLoading,
  } = useAdminBoxAmenities();
  
  const {
    data: users,
    isLoading: usersLoading,
  } = useAdminUsers();
  
  const {
    data: stables,
    isLoading: stablesLoading,
  } = useAdminStables();
  
  const {
    data: boxes,
    isLoading: boxesLoading,
  } = useAdminBoxes();
  
  const {
    data: payments,
    isLoading: paymentsLoading,
  } = useAdminPayments();
  
  const adminDataLoading = roadmapLoading || basePriceLoading || discountsLoading || stableAmenitiesLoading || boxAmenitiesLoading || usersLoading || stablesLoading || boxesLoading || paymentsLoading;

  useEffect(() => {
    if (loading || userLoading) return;
    
    if (!user) {
      router.push('/logg-inn');
      return;
    }

    // Check if user is admin after loading user data
    if (currentUser && !currentUser.isAdmin) {
      router.push('/');
      return;
    }
  }, [user, loading, userLoading, currentUser, router]);

  if (loading || userLoading || adminDataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Sjekker tilgang...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <ShieldExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ikke logget inn</h1>
          <p className="text-slate-600 mb-6">Du må logge inn for å få tilgang til admin området.</p>
          <button
            onClick={() => router.push('/logg-inn')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Logg inn
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <ShieldExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ingen tilgang</h1>
          <p className="text-slate-600 mb-6">Du har ikke administratorrettigheter for å se denne siden.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tilbake til forsiden
          </button>
        </div>
      </div>
    );
  }

  // Only require basePrice to be loaded, arrays can be empty
  if (!basePrice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Laster admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider isAdmin={currentUser?.isAdmin || false}>
      <AdminDashboard 
        initialData={{
          roadmapItems: roadmapItems || [],
          basePrice: basePrice || { price: 0, name: '', id: '', description: null, createdAt: new Date(), updatedAt: new Date(), isActive: false },
          discounts: discounts || [],
          stableAmenities: stableAmenities || [],
          boxAmenities: boxAmenities || [],
          users: users || [],
          stables: stables || [],
          boxes: boxes || [],
          payments: payments || [],
        }}
      />
    </AdminProvider>
  );
}