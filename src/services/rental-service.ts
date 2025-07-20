import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'

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
    monthly_price: number
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
  status?: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

/**
 * Get all rentals for a stable owner's stables
 */
export async function getStableOwnerRentals(ownerId: string): Promise<RentalWithRelations[]> {
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
    .eq('stable.owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return rentals as RentalWithRelations[]
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
    .eq('stable_id', stableId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return rentals as RentalWithRelations[]
}

/**
 * Create a new rental
 */
export async function createRental(data: CreateRentalData): Promise<Rental> {
  const { data: rental, error } = await supabase
    .from('rentals')
    .insert({
      stable_id: data.stable_id,
      box_id: data.box_id,
      rider_id: data.rider_id,
      conversation_id: data.conversation_id,
      start_date: data.start_date,
      end_date: data.end_date,
      monthly_price: data.monthly_price,
      status: data.status || 'PENDING'
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
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
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
  // Get total rentals
  const { count: totalRentals, error: totalError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('stable.owner_id', ownerId)

  if (totalError) throw totalError

  // Get active rentals
  const { count: activeRentals, error: activeError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('stable.owner_id', ownerId)
    .eq('status', 'ACTIVE')

  if (activeError) throw activeError

  // Get pending rentals
  const { count: pendingRentals, error: pendingError } = await supabase
    .from('rentals')
    .select('*', { count: 'exact', head: true })
    .eq('stable.owner_id', ownerId)
    .in('status', ['PENDING', 'CONFIRMED'])

  if (pendingError) throw pendingError

  // Get monthly revenue (current month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyRevenue, error: revenueError } = await supabase
    .from('rentals')
    .select('monthly_price')
    .eq('stable.owner_id', ownerId)
    .eq('status', 'ACTIVE')
    .gte('start_date', startOfMonth.toISOString())

  if (revenueError) throw revenueError

  const totalMonthlyRevenue = monthlyRevenue?.reduce((sum, rental) => sum + rental.monthly_price, 0) || 0

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
          const { data: stable } = await supabase
            .from('stables')
            .select('owner_id')
            .eq('id', rentalData.stable_id)
            .single()

          if (stable?.owner_id === ownerId) {
            onRentalChange(
              (payload.new || payload.old) as Rental, 
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
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
        const rental = payload.new as Rental

        // Check if this is for one of the owner's stables
        const { data: stableData } = await supabase
          .from('stables')
          .select('owner_id')
          .eq('id', rental.stable_id)
          .single()

        if (stableData?.owner_id === ownerId) {
          // Fetch full rental data with relations
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
            .eq('id', rental.id)
            .single()

          if (fullRental) {
            onNewRequest(fullRental as RentalWithRelations)
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