import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export async function sjekkBrukerErAdmin(firebaseId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('brukere')
      .select('er_admin')
      .eq('firebase_id', firebaseId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return user?.er_admin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function krevAdmin(firebaseId: string): Promise<void> {
  const isAdmin = await sjekkBrukerErAdmin(firebaseId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

// Real-time admin data fetching functions
export async function hentAdminBrukereMedAntall() {
  const { data, error } = await supabase
    .from('brukere')
    .select(`
      *,
      stables:staller(count),
      payments:betalinger(count)
    `)
    .order('opprettet_dato', { ascending: false });

  if (error) throw error;
  return data;
}

export async function hentAdminStallerMedAntall() {
  const { data, error } = await supabase
    .from('staller')
    .select(`
      *,
      owner:brukere!staller_eier_id_fkey(
        id,
        email,
        name
      ),
      boxes:stallplasser(count),
      conversations:samtaler(count),
      payments:betalinger(count)
    `)
    .order('opprettet_dato', { ascending: false });

  if (error) throw error;
  return data;
}

export async function hentAdminStallplasserMedAntall() {
  const { data, error } = await supabase
    .from('stallplasser')
    .select(`
      *,
      stable:staller!stallplasser_stall_id_fkey(
        id,
        name,
        owner:brukere!staller_eier_id_fkey(
          email,
          name
        )
      ),
      conversations:samtaler(count),
      box_rentals:stallplass_utleie(count)
    `)
    .order('opprettet_dato', { ascending: false });

  if (error) throw error;
  return data;
}

export async function hentAdminBetalingerMedDetaljer() {
  const { data, error } = await supabase
    .from('betalinger')
    .select(`
      *,
      user:brukere!betalinger_bruker_id_fkey(
        id,
        firebase_id,
        email,
        name
      ),
      stable:staller!betalinger_stall_id_fkey(
        id,
        name,
        owner:brukere!staller_eier_id_fkey(
          email,
          name
        )
      )
    `)
    .order('opprettet_dato', { ascending: false});

  if (error) throw error;
  return data;
}

// Real-time subscription helpers
export function abonnerPaAdminTabellEndringer(
  tabellNavn: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`admin-${tabellNavn}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tabellNavn
      },
      callback
    )
    .subscribe();

  return channel;
}

export function abonnerPaBetalingsStatusEndringer(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-betalings-status-endringer')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'betalinger',
        filter: 'status=neq.PENDING'
      },
      callback
    )
    .subscribe();

  return channel;
}

export function abonnerPaHoyverdiBetalinger(
  minBelop: number = 1000,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-hoyverdi-betalinger')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'betalinger',
        filter: `total_belop.gte.${minBelop}`
      },
      callback
    )
    .subscribe();

  return channel;
}

export function abonnerPaNyeBrukerRegistreringer(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-nye-brukere')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'brukere'
      },
      callback
    )
    .subscribe();

  return channel;
}

export function abonnerPaStallStatusEndringer(
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel('admin-stall-status-endringer')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'staller',
        filter: 'fremhevet=eq.true,reklame_aktiv=eq.true'
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

export async function loggAdminAktivitet(
  adminFirebaseId: string,
  handling: string,
  malType: AdminActivity['target_type'],
  malId?: string,
  detaljer?: Record<string, unknown>
) {
  // TODO: Implement when admin_aktiviteter table is created
  console.log('Admin aktivitet:', {
    adminFirebaseId,
    handling,
    malType,
    malId,
    detaljer,
    tidsstempel: new Date().toISOString()
  });
}

export async function hentNyligAdminAktiviteter(grense: number = 50) {
  // TODO: Implement when admin_aktiviteter table is created
  console.log('Forespurt nylige admin aktiviteter med grense:', grense);
  return [];
}

// Cleanup and maintenance functions
export async function utforSystemRydding() {
  try {
    // This would typically call your cleanup API endpoint
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Rydding feilet');
    }

    return await response.json();
  } catch (error) {
    console.error('Error performing system cleanup:', error);
    throw error;
  }
}

// English aliases for backward compatibility
export const checkUserIsAdmin = sjekkBrukerErAdmin;
export const requireAdmin = krevAdmin;
export const getAdminUsersWithCounts = hentAdminBrukereMedAntall;
export const getAdminStablesWithCounts = hentAdminStallerMedAntall;
export const getAdminBoxesWithCounts = hentAdminStallplasserMedAntall;
export const getAdminPaymentsWithDetails = hentAdminBetalingerMedDetaljer;
export const subscribeToAdminTableChanges = abonnerPaAdminTabellEndringer;
export const subscribeToPaymentStatusChanges = abonnerPaBetalingsStatusEndringer;
export const subscribeToHighValuePayments = abonnerPaHoyverdiBetalinger;
export const subscribeToNewUserRegistrations = abonnerPaNyeBrukerRegistreringer;
export const subscribeToStableStatusChanges = abonnerPaStallStatusEndringer;
export const logAdminActivity = loggAdminAktivitet;
export const getRecentAdminActivities = hentNyligAdminAktiviteter;
export const performSystemCleanup = utforSystemRydding;