'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from './AdminDashboard';
import { AdminProvider } from '@/lib/admin-context';
import { 
  useAdminStableAmenities,
  useAdminBoxAmenities,
  useAdminProfiles,
  useAdminStables,
  useAdminBoxes,
  useIsAdmin
} from '@/hooks/useAdminQueries';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import type { AdminProfile, AdminStable, AdminBox } from '@/types/admin';
import type { profiles } from '@/generated/prisma';

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Check if current user is admin
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsAdmin();
  
  // Only fetch admin data if user is authenticated and is admin
  
  const {
    data: stableAmenities,
  } = useAdminStableAmenities();
  
  const {
    data: boxAmenities,
  } = useAdminBoxAmenities();
  
  const {
    data: profiles,
  } = useAdminProfiles();
  
  const {
    data: stables,
  } = useAdminStables();
  
  const {
    data: boxes,
  } = useAdminBoxes();

  // Services data is loaded within ServicesAdmin component
  
  // Individual loading states are handled within AdminDashboard components

  useEffect(() => {
    if (loading || adminCheckLoading) return;
    
    if (!user) {
      router.push('/logg-inn');
      return;
    }

    // Check if user is admin after loading admin status
    if (isAdmin === false) {
      router.push('/');
      return;
    }
  }, [user, loading, adminCheckLoading, isAdmin, router]);

  // Show loading only while checking auth and admin status
  if (loading || adminCheckLoading) {
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

  if (!isAdmin) {
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

  // Admin data will load progressively - no need to block UI

  return (
    <AdminProvider isAdmin={isAdmin || false}>
      <AdminDashboard 
        initialData={{
          stableAmenities: stableAmenities || [],
          boxAmenities: boxAmenities || [],
          profiles: (profiles || []).map((profile: profiles & { _count?: Record<string, unknown> }) => ({
            ...profile,
            _count: {
              stables: (profile._count?.stables as number) || 0,
              invoiceRequests: (profile._count?.invoiceRequests as number) || 0,
            }
          })) as AdminProfile[],
          stables: (stables || []).map(stable => ({
            ...stable,
            advertisingActive: (stable as Record<string, unknown>).advertisingActive as boolean,
            owner: (stable as Record<string, unknown>).owner as profiles,
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