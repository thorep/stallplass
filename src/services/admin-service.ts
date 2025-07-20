import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export async function checkUserIsAdmin(firebaseId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('firebase_id', firebaseId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return user?.is_admin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(firebaseId: string): Promise<void> {
  const isAdmin = await checkUserIsAdmin(firebaseId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

// Real-time admin data fetching functions
export async function getAdminUsersWithCounts() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      stables:stables(count),
      payments:payments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminStablesWithCounts() {
  const { data, error } = await supabase
    .from('stables')
    .select(`
      *,
      owner:users!stables_owner_id_fkey(
        id,
        email,
        name
      ),
      boxes:boxes(count),
      conversations:conversations(count),
      payments:payments(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminBoxesWithCounts() {
  const { data, error } = await supabase
    .from('boxes')
    .select(`
      *,
      stable:stables!boxes_stable_id_fkey(
        id,
        name,
        owner:users!stables_owner_id_fkey(
          email,
          name
        )
      ),
      conversations:conversations(count),
      box_rentals:box_rentals(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminPaymentsWithDetails() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      user:users!payments_user_id_fkey(
        id,
        firebase_id,
        email,
        name
      ),
      stable:stables!payments_stable_id_fkey(
        id,
        name,
        owner:users!stables_owner_id_fkey(
          email,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Real-time subscription helpers
export function subscribeToAdminTableChanges(
  tableName: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`admin-${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      callback
    )
    .subscribe();

  return channel;
}

export function subscribeToPaymentStatusChanges(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-payment-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: 'status=neq.PENDING'
      },
      callback
    )
    .subscribe();

  return channel;
}

export function subscribeToHighValuePayments(
  minAmount: number = 1000,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-high-value-payments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
        filter: `total_amount.gte.${minAmount}`
      },
      callback
    )
    .subscribe();

  return channel;
}

export function subscribeToNewUserRegistrations(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-new-users')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'users'
      },
      callback
    )
    .subscribe();

  return channel;
}

export function subscribeToStableStatusChanges(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-stable-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables',
        filter: 'featured=eq.true,advertising_active=eq.true'
      },
      callback
    )
    .subscribe();

  return channel;
}

// Admin activity tracking
export interface AdminActivity {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: 'user' | 'stable' | 'box' | 'payment' | 'system';
  target_id?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export async function logAdminActivity(
  adminFirebaseId: string,
  action: string,
  targetType: AdminActivity['target_type'],
  targetId?: string,
  details?: Record<string, unknown>
) {
  try {
    const { error } = await supabase
      .from('admin_activities')
      .insert({
        admin_user_id: adminFirebaseId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging admin activity:', error);
    }
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
}

export async function getRecentAdminActivities(limit: number = 50) {
  const { data, error } = await supabase
    .from('admin_activities')
    .select(`
      *,
      admin:users!admin_activities_admin_user_id_fkey(
        name,
        email
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching admin activities:', error);
    return [];
  }

  return data || [];
}

// Cleanup and maintenance functions
export async function performSystemCleanup() {
  try {
    // This would typically call your cleanup API endpoint
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Cleanup failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing system cleanup:', error);
    throw error;
  }
}