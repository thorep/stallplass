'use client';

import { AdminDashboard } from './AdminDashboard';
import { AdminProvider } from '@/lib/admin-context';
import { 
  useAdminStableAmenities,
  useAdminBoxAmenities,
  useAdminProfiles,
  useAdminStables,
  useAdminBoxes,
  useAdminHorses,
} from '@/hooks/useAdminQueries';
import type { AdminProfile, AdminStable, AdminBox } from '@/types/admin';
import type { profiles } from '@/generated/prisma';

export function AdminPageClient() {
  // User is already authenticated as admin from server-side
  
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

  const {
    data: horses,
  } = useAdminHorses();

  // Services data is loaded within ServicesAdmin component
  
  // Individual loading states are handled within AdminDashboard components

  // Server-side authentication ensures user is admin - no client-side checks needed

  return (
    <AdminProvider isAdmin={true}>
      <AdminDashboard 
        initialData={{
          stableAmenities: stableAmenities || [],
          boxAmenities: boxAmenities || [],
          profiles: (profiles || []).map((profile: profiles & { _count?: Record<string, unknown> }) => ({
            ...profile,
            _count: {
              stables: (profile._count?.stables as number) || 0,
            }
          })) as AdminProfile[],
          stables: (stables || []).map(stable => ({
            ...stable,
            advertisingActive: (stable as Record<string, unknown>).advertisingActive as boolean,
            owner: (stable as Record<string, unknown>).owner as profiles,
            _count: {
              boxes: ((stable as unknown as { _count?: Record<string, unknown> })._count)?.boxes as number || 0,
              conversations: ((stable as unknown as { _count?: Record<string, unknown> })._count)?.conversations as number || 0,
            }
          })) as AdminStable[],
          boxes: (boxes || []).map(box => ({
            ...box,
            _count: { conversations: 0 }  // Add missing _count property
          })) as AdminBox[],
          horses: horses || [],
          // Remove payments - no longer needed
        }}
      />
    </AdminProvider>
  );
}