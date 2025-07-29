'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { AdminProvider } from '@/lib/admin-context';
import { 
  useAdminStableAmenities,
  useAdminBoxAmenities,
  useAdminUsers,
  useAdminStables,
  useAdminBoxes
} from '@/hooks/useAdminQueries';
import { useUser } from '@/hooks/useUser';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { AdminUser, AdminStable, AdminBox } from '@/types/admin';
import type { users } from '@/generated/prisma';

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Get current user data from database (including admin status)
  const { data: currentUser, isLoading: userLoading } = useUser(user?.id);
  
  // Only fetch admin data if user is authenticated and is admin
  
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
  
  const adminDataLoading = stableAmenitiesLoading || boxAmenitiesLoading || usersLoading || stablesLoading || boxesLoading;

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

  // Show loading if we're still fetching required admin data
  if (adminDataLoading) {
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
          stableAmenities: stableAmenities || [],
          boxAmenities: boxAmenities || [],
          users: (users || []).map(user => ({
            ...user,
            _count: {
              stables: ((user as unknown as { _count?: Record<string, unknown> })._count)?.stables as number || 0,
              invoiceRequests: ((user as unknown as { _count?: Record<string, unknown> })._count)?.invoiceRequests as number || 0,
            }
          })) as AdminUser[],
          stables: (stables || []).map(stable => ({
            ...stable,
            advertisingActive: (stable as Record<string, unknown>).advertisingActive as boolean,
            owner: (stable as Record<string, unknown>).owner as users,
            _count: {
              boxes: ((stable as unknown as { _count?: Record<string, unknown> })._count)?.boxes as number || 0,
              conversations: ((stable as unknown as { _count?: Record<string, unknown> })._count)?.conversations as number || 0,
              invoiceRequests: ((stable as unknown as { _count?: Record<string, unknown> })._count)?.invoiceRequests as number || 0,
            }
          })) as AdminStable[],
          boxes: (boxes || []).map(box => ({
            ...box,
            _count: { conversations: 0 }  // Add missing _count property
          })) as AdminBox[],
          payments: [] as never[], // Remove payments - replaced with invoice requests
        }}
      />
    </AdminProvider>
  );
}