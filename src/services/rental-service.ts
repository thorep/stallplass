import { prisma } from './prisma'
import { supabase } from '@/lib/supabase'
import type { rentals, stables, boxes, users, conversations, RentalStatus } from '@/generated/prisma'

export type Rental = rentals

// Type for rental with all relations
export type RentalWithRelations = Rental & {
  stables: stables
  boxes: boxes
  users: users
  conversations: conversations
}


export interface CreateRentalData {
  stableId: string
  boxId: string
  riderId: string
  conversationId: string
  startDate: string
  endDate?: string
  monthlyPrice: number
  status?: RentalStatus
}


/**
 * Get all rentals for a stable owner's stables
 */
export async function getStableOwnerRentals(ownerId: string): Promise<RentalWithRelations[]> {
  try {
    // First get stable IDs for this owner
    const stables = await prisma.stables.findMany({
      where: { ownerId },
      select: { id: true }
    })

    const stableIds = stables.map(s => s.id)
    if (stableIds.length === 0) return []

    return await prisma.rentals.findMany({
      where: { stableId: { in: stableIds } },
      include: {
        stables: true,
        boxes: true,
        users: true,
        conversations: true
      },
      orderBy: { createdAt: 'desc' }
    }) as RentalWithRelations[]
  } catch (error) {
    throw new Error(`Failed to get stable owner rentals: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


/**
 * Get rentals for a specific stable
 */
export async function getStableRentals(stableId: string): Promise<RentalWithRelations[]> {
  try {
    return await prisma.rentals.findMany({
      where: { stableId },
      include: {
        stables: true,
        boxes: true,
        users: true,
        conversations: true
      },
      orderBy: { createdAt: 'desc' }
    }) as RentalWithRelations[]
  } catch (error) {
    throw new Error(`Failed to get stable rentals: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


/**
 * Create a new rental
 */
export async function createRental(data: CreateRentalData): Promise<Rental> {
  try {
    return await prisma.rentals.create({
      data: {
        boxId: data.boxId,
        riderId: data.riderId,
        conversationId: data.conversationId,
        stableId: data.stableId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        monthlyPrice: data.monthlyPrice,
        status: data.status || 'ACTIVE',
        updatedAt: new Date()
      }
    })
  } catch (error) {
    throw new Error(`Failed to create rental: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


/**
 * Update rental status
 */
export async function updateRentalStatus(
  rentalId: string, 
  status: RentalStatus
): Promise<Rental> {
  try {
    return await prisma.rentals.update({
      where: { id: rentalId },
      data: { 
        status,
        updatedAt: new Date()
      }
    })
  } catch (error) {
    throw new Error(`Failed to update rental status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


/**
 * Get rental statistics for a stable owner
 */
export async function getStableOwnerRentalStats(ownerId: string) {
  try {
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

    // Count conversations that are active but not yet confirmed as rentals
    const { count: pendingRentals, error: pendingError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('stable_id', stable_ids)
      .eq('status', 'ACTIVE')

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

    if (revenueError) throw revenueError

    const monthlyRevenue = monthlyRevenueData?.reduce((sum, rental) => sum + (rental.monthly_price || 0), 0) || 0

    return {
      totalRentals,
      activeRentals,
      pendingRentals,
      monthlyRevenue
    }
  } catch (error) {
    throw new Error(`Error getting rental stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


// TODO: Real-time subscription functions removed during Prisma migration
// These functions were Supabase-specific and need to be replaced with
// alternative real-time solutions if needed (e.g., WebSockets, Server-Sent Events)

// All functions now use English terminology - Norwegian wrappers have been removed
// Use the English function names directly

