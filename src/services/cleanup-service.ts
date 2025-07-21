/**
 * Cleanup service for handling expired advertising and sponsored placements
 * Can be called manually or via cron jobs
 */

import { supabaseServer } from '@/lib/supabase-server';

export interface CleanupResults {
  expiredStables: number;
  deactivatedBoxes: number;
  expiredSponsoredBoxes: number;
  timestamp: Date;
}

/**
 * Clean up all expired advertising and sponsored placements
 */
export async function cleanupExpiredContent(): Promise<CleanupResults> {
  const now = new Date().toISOString();
  
  try {
    // 1. Deactivate expired stable advertising
    const { data: expiredStablesData, error: stablesError } = await supabaseServer
      .from('stables')
      .update({ reklame_aktiv: false })
      .eq('reklame_aktiv', true)
      .lt('reklame_slutt_dato', now)
      .select('id');

    if (stablesError) {
      throw new Error(`Failed to update expired stables: ${stablesError.message}`);
    }

    const expiredStablesCount = expiredStablesData?.length || 0;

    // 2. Deactivate boxes for stables with expired advertising
    // First get stables with inactive advertising
    const { data: inactiveStables, error: inactiveStablesError } = await supabaseServer
      .from('stables')
      .select('id')
      .eq('reklame_aktiv', false);

    if (inactiveStablesError) {
      throw new Error(`Failed to get inactive stables: ${inactiveStablesError.message}`);
    }

    const inactiveStableIds = inactiveStables?.map(s => s.id) || [];
    
    // Only try to deactivate boxes if there are inactive stables
    let deactivatedBoxesData = null;
    if (inactiveStableIds.length > 0) {
      const { data, error: boxesError } = await supabaseServer
        .from('boxes')
        .update({ is_active: false })
        .eq('is_active', true)
        .in('stall_id', inactiveStableIds)
        .select('id');

      if (boxesError) {
        throw new Error(`Failed to deactivate boxes: ${boxesError.message}`);
      }
      
      deactivatedBoxesData = data;
    }

    const deactivatedBoxesCount = deactivatedBoxesData?.length || 0;

    // 3. Remove expired sponsored placements
    const { data: expiredSponsoredData, error: sponsoredError } = await supabaseServer
      .from('boxes')
      .update({ 
        er_sponset: false,
        sponset_til: null,
        sponsored_start_date: null
      })
      .eq('er_sponset', true)
      .lt('sponsored_until', now)
      .select('id');

    if (sponsoredError) {
      throw new Error(`Failed to update sponsored placements: ${sponsoredError.message}`);
    }

    const expiredSponsoredCount = expiredSponsoredData?.length || 0;

    return {
      expiredStables: expiredStablesCount,
      deactivatedBoxes: deactivatedBoxesCount,
      expiredSponsoredBoxes: expiredSponsoredCount,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Cleanup operation failed:', error);
    throw new Error('Failed to cleanup expired content');
  }
}

/**
 * Get stables that will expire soon (for notifications)
 */
export async function getExpiringStables(daysAhead: number = 7) {
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000)).toISOString();

  const { data, error } = await supabaseServer
    .from('stables')
    .select(`
      *,
      owner:brukere!staller_eier_id_fkey(
        id,
        email,
        name,
        firebase_id
      )
    `)
    .eq('reklame_aktiv', true)
    .gte('reklame_slutt_dato', now)
    .lte('reklame_slutt_dato', futureDate)
    .order('reklame_slutt_dato', { ascending: true });

  if (error) {
    throw new Error(`Failed to get expiring stables: ${error.message}`);
  }

  return data || [];
}

/**
 * Get sponsored placements that will expire soon
 */
export async function getExpiringSponsoredPlacements(daysAhead: number = 3) {
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000)).toISOString();

  const { data, error } = await supabaseServer
    .from('boxes')
    .select(`
      *,
      stable:stables(
        *,
        owner:brukere!staller_eier_id_fkey(
          id,
          email,
          name,
          firebase_id
        )
      )
    `)
    .eq('er_sponset', true)
    .gte('sponsored_until', now)
    .lte('sponsored_until', futureDate)
    .order('sponsored_until', { ascending: true });

  if (error) {
    throw new Error(`Failed to get expiring sponsored placements: ${error.message}`);
  }

  return data || [];
}

/**
 * Manual cleanup function that can be called from admin panel
 */
export async function forceCleanup(): Promise<CleanupResults> {
  return await cleanupExpiredContent();
}