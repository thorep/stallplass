'use client';

import { supabase } from '@/lib/supabase';
import { Box, BoxWithStablePreview } from '@/types/stable';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to box availability changes across all stables
 */
export function subscribeToAllBoxes(
  onBoxChange: (box: BoxWithStablePreview & { _deleted?: boolean }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('all-boxes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      (payload) => {
        console.log('Box change detected:', payload);
        
        if (payload.eventType === 'DELETE') {
          // For deletes, we only have the old record
          const deletedBox = payload.old as BoxWithStablePreview;
          onBoxChange({ ...deletedBox, _deleted: true });
        } else {
          // For inserts and updates, use the new record
          const box = payload.new as BoxWithStablePreview;
          onBoxChange(box);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Update the availability date for a box
 */
export async function updateBoxAvailabilityDate(boxId: string, availableFromDate: string | null): Promise<Box> {
  const { error } = await supabase
    .from('boxes')
    .update({ available_from_date: availableFromDate })
    .eq('id', boxId);
    
  if (error) {
    throw new Error(`Failed to update box availability date: ${error.message}`);
  }
  
  // Fetch the updated box
  const { data: updatedBox, error: fetchError } = await supabase
    .from('boxes')
    .select('*')
    .eq('id', boxId)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch updated box: ${fetchError.message}`);
  }
  
  return updatedBox as Box;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromBoxChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}