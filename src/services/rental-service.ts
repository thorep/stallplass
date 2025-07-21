import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables, Database } from '@/types/supabase'

export type Rental = Tables<'rentals'>

export interface RentalWithRelations extends Rental {
  stable: {
    id: string
    name: string
    owner_id: string
  }
  box: {
    id: string
    name: string
    price: number
  }
  rider: {
    id: string
    name: string | null
    email: string
  }
  conversation: {
    id: string
    status: string
  }
}


export interface CreateRentalData {
  stable_id: string
  box_id: string
  rider_id: string
  conversation_id: string
  start_date: string
  end_date?: string
  monthly_price: number
  status?: Database['public']['Enums']['rental_status']
}


/**
 * Get all rentals for a stable owner's stables
 */
export async function getStableOwnerRentals(ownerId: string): Promise<RentalWithRelations[]> {
  // First get stable IDs for this owner
  const { data: stables, error: stablesError } = await supabase
    .from('stables')
    .select('id')
    .eq('owner_id', ownerId)

  if (stablesError) throw stablesError

  const stable_ids = stables?.map(s => s.id) || []
  if (stable_ids.length === 0) return []

  const { data: rentals, error } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:stables!rentals_stable_id_fkey (
        id,
        name,
        owner_id
      ),
      box:boxes!rentals_box_id_fkey (
        id,
        name,
        price
      ),
      rider:users!rentals_rider_id_fkey (
        id,
        name,
        email
      ),
      conversation:conversations!rentals_conversation_id_fkey (
        id,
        status
      )
    `)
    .in('stable_id', stable_ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Transform the data to match our interface
  return (rentals || []).map(rental => ({
    ...rental,
    stable: rental.stable as { id: string; name: string; owner_id: string },
    box: {
      id: rental.box?.id || '',
      name: rental.box?.name || '',
      price: rental.box?.price || 0
    },
    rider: rental.rider as { id: string; name: string | null; email: string },
    conversation: rental.conversation as { id: string; status: string }
  }))
}


/**
 * Get rentals for a specific stable
 */
export async function getStableRentals(stableId: string): Promise<RentalWithRelations[]> {
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:stables!rentals_stable_id_fkey (
        id,
        name,
        owner_id
      ),
      box:boxes!rentals_box_id_fkey (
        id,
        name,
        price
      ),
      rider:users!rentals_rider_id_fkey (
        id,
        name,
        email
      ),
      conversation:conversations!rentals_conversation_id_fkey (
        id,
        status
      )
    `)
    .eq('stable_id', stableId)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Transform the data to match our interface
  return (rentals || []).map(rental => ({
    ...rental,
    stable: rental.stable as { id: string; name: string; owner_id: string },
    box: {
      id: rental.box?.id || '',
      name: rental.box?.name || '',
      price: rental.box?.price || 0
    },
    rider: rental.rider as { id: string; name: string | null; email: string },
    conversation: rental.conversation as { id: string; status: string }
  }))
}


/**
 * Create a new rental
 */
export async function createRental(data: CreateRentalData): Promise<Rental> {
  const { data: rental, error } = await supabase
    .from('rentals')
    .insert({
      box_id: data.box_id,
      rider_id: data.rider_id,
      conversation_id: data.conversation_id,
      start_date: data.start_date,
      end_date: data.end_date,
      monthly_price: data.monthly_price,
      stable_id: data.stable_id,
      status: data.status || 'ACTIVE'
    })
    .select()
    .single()

  if (error) throw error
  return rental
}


/**
 * Update rental status
 */
export async function updateRentalStatus(
  rentalId: string, 
  status: Database['public']['Enums']['rental_status']
): Promise<Rental> {
  const { data: rental, error } = await supabase
    .from('rentals')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', rentalId)
    .select()
    .single()

  if (error) throw error
  return rental
}


/**
 * Get rental statistics for a stable owner
 */
export async function getStableOwnerRentalStats(ownerId: string) {
  // First, get all stable IDs for this owner
  const { data: stables, error: stablesError } = await supabase
    .from('stables')
    .select('id')
    .eq('owner_id', ownerId)

  if (stablesError) throw stablesError
  
  const stable_ids = stables?.map(s => s.id) || []
  if (stable_ids.length === 0) {
    return {
      totalRentals: 0,
      activeRentals: 0,
      pendingRentals: 0,
      monthlyRevenue: 0
    }
  }

  // Get total rentals
  const { count: totalRentals, error: totalError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .in('stable_id', stable_ids)

  if (totalError) throw totalError

  // Get active rentals
  const { count: activeRentals, error: activeError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .in('stable_id', stable_ids)
    .eq('status', 'ACTIVE')

  if (activeError) throw activeError

  // Get pending rentals - note: checking against actual enum values
  const { count: pendingRentals, error: pendingError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .in('stable_id', stable_ids)
    .eq('status', 'PENDING')

  if (pendingError) throw pendingError

  // Get monthly revenue (current month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyRevenueData, error: revenueError } = await supabase
    .from('rentals')
    .select('monthly_price')
    .in('stable_id', stable_ids)
    .eq('status', 'ACTIVE')
    .gte('start_date', startOfMonth.toISOString())

  if (revenueError) throw revenueError

  const totalMonthlyRevenue = monthlyRevenueData?.reduce((sum, rental) => sum + rental.monthly_price, 0) || 0

  return {
    totalRentals: totalRentals || 0,
    activeRentals: activeRentals || 0,
    pendingRentals: pendingRentals || 0,
    monthlyRevenue: totalMonthlyRevenue
  }
}


/**
 * Subscribe to rental changes for a stable owner's stables
 */
export function subscribeToStableOwnerRentals(
  ownerId: string,
  onRentalChange: (rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-rentals-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rentals'
      },
      async (payload) => {
        // Check if this rental belongs to one of the owner's stables
        if (payload.new || payload.old) {
          const rentalData = payload.new || payload.old
          if (rentalData && 'stable_id' in rentalData) {
            const { data: stable } = await supabase
              .from('stables')
              .select('owner_id')
              .eq('id', (rentalData as {stable_id: string}).stable_id)
              .single()

            if (stable?.owner_id === ownerId) {
              onRentalChange(
                rentalData as Rental, 
                payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
              )
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}


/**
 * Subscribe to rental status changes
 */
export function subscribeToRentalStatusChanges(
  onStatusChange: (rental: Rental) => void
): RealtimeChannel {
  const channel = supabase
    .channel('rental-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rentals'
      },
      (payload) => {
        // Only trigger if status actually changed
        if (payload.old?.status !== payload.new?.status) {
          onStatusChange(payload.new as Rental)
        }
      }
    )
    .subscribe()

  return channel
}


/**
 * Subscribe to new rental requests for a stable owner
 */
export function subscribeToNewRentalRequests(
  ownerId: string,
  onNewRequest: (rental: RentalWithRelations) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`new-rental-requests-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rentals'
      },
      async (payload) => {
        const rental = payload.new
        if (!rental || !('stable_id' in rental)) return

        // Check if this is for one of the owner's stables
        const { data: stableData } = await supabase
          .from('stables')
          .select('owner_id')
          .eq('id', (rental as {stable_id: string}).stable_id)
          .single()

        if (stableData?.owner_id === ownerId) {
          // Get full rental data with relations
          const { data: fullRental } = await supabase
            .from('rentals')
            .select(`
              *,
              stable:stables!rentals_stable_id_fkey (
                id,
                name,
                owner_id
              ),
              box:boxes!rentals_box_id_fkey (
                id,
                name,
                monthly_price
              ),
              rider:users!rentals_rider_id_fkey (
                id,
                name,
                email
              ),
              conversation:conversations!rentals_conversation_id_fkey (
                id,
                status
              )
            `)
            .eq('id', (rental as {id: string}).id)
            .single()

          if (fullRental) {
            // Transform the data to match our interface
            const transformedRental: RentalWithRelations = {
              ...fullRental,
              stable: fullRental.stable as { id: string; name: string; owner_id: string },
              box: {
                id: fullRental.box?.id || '',
                name: fullRental.box?.name || '',
                price: fullRental.box?.price || 0
              },
              rider: fullRental.rider as { id: string; name: string | null; email: string },
              conversation: fullRental.conversation as { id: string; status: string }
            }
            onNewRequest(transformedRental)
          }
        }
      }
    )
    .subscribe()

  return channel
}


/**
 * Unsubscribe from a rental channel
 */
export function unsubscribeFromRentalChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}

// Norwegian wrapper functions for backward compatibility
export const hentStalleierUtleier = getStableOwnerRentals;
export const opprettUtleie = createRental;
export const oppdaterUtleieStatus = updateRentalStatus;
export const hentStalleierUtleieStatistikk = getStableOwnerRentalStats;
export type OpprettUtleieData = CreateRentalData;

