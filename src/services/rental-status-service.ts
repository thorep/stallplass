import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables, Database } from '@/types/supabase'
import { updateRentalStatus } from '@/services/rental-service'

export type Rental = Tables<'rentals'>
export type RentalStatus = Database['public']['Enums']['rental_status']

export interface RentalStatusTransition {
  id: string
  rentalId: string
  fromStatus: RentalStatus
  toStatus: RentalStatus
  timestamp: Date
  triggeredBy: string
  reason?: string
  automatic: boolean
  metadata?: Record<string, unknown>
}

export interface RentalConflict {
  id: string
  type: 'DOUBLE_BOOKING' | 'OVERLAPPING_DATES' | 'BOX_UNAVAILABLE' | 'PAYMENT_PENDING' | 'INVALID_TRANSITION'
  rentalIds: string[]
  boxId: string
  stableId: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  detectedAt: Date
  resolvedAt?: Date
  resolutionStrategy?: string
  autoResolvable: boolean
  metadata?: {
    conflictingDates?: { start: string; end: string }[]
    suggestedActions?: string[]
    impactedUsers?: string[]
  }
}

export interface ConflictResolution {
  conflictId: string
  strategy: 'CANCEL_CONFLICTING' | 'ADJUST_DATES' | 'MANUAL_REVIEW' | 'APPROVE_OVERRIDE'
  executedBy: string
  executedAt: Date
  details: string
  success: boolean
  rollbackPlan?: string
}

/**
 * Rental status validation rules
 */
export const STATUS_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  ACTIVE: ['ENDED', 'CANCELLED'],
  ENDED: [], // Terminal state
  CANCELLED: [] // Terminal state
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: RentalStatus, to: RentalStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) || false
}

/**
 * Get possible next statuses for a rental
 */
export function getPossibleNextStatuses(currentStatus: RentalStatus): RentalStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Update rental status with validation and conflict detection
 */
export async function updateRentalStatusSafe(
  rentalId: string,
  newStatus: RentalStatus,
  triggeredBy: string,
  reason?: string
): Promise<{
  success: boolean
  rental?: Rental
  conflicts?: RentalConflict[]
  error?: string
}> {
  try {
    // Get current rental data
    const { data: currentRental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', rentalId)
      .single()

    if (fetchError || !currentRental) {
      return { 
        success: false, 
        error: 'Rental not found' 
      }
    }

    const currentStatus = currentRental.status as RentalStatus

    // Validate transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`
      }
    }

    // Check for conflicts before updating
    const conflicts = await detectStatusChangeConflicts(currentRental, newStatus)
    
    if (conflicts.length > 0 && conflicts.some(c => c.severity === 'CRITICAL')) {
      return {
        success: false,
        conflicts,
        error: 'Critical conflicts detected. Status update blocked.'
      }
    }

    // Update the status
    const updatedRental = await updateRentalStatus(rentalId, newStatus)

    // Log the transition
    await logStatusTransition({
      id: `${Date.now()}-${Math.random()}`,
      rentalId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      timestamp: new Date(),
      triggeredBy,
      reason,
      automatic: false,
      metadata: {
        conflicts: conflicts.length,
        validationPassed: true
      }
    })

    return {
      success: true,
      rental: updatedRental,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Detect potential conflicts when changing rental status
 */
export async function detectStatusChangeConflicts(
  rental: Rental,
  newStatus: RentalStatus
): Promise<RentalConflict[]> {
  const conflicts: RentalConflict[] = []

  // Check for double booking conflicts when activating a rental
  if (newStatus === 'ACTIVE') {
    const { data: existingActiveRentals } = await supabase
      .from('rentals')
      .select(`
        id,
        start_date,
        end_date,
        rider_id,
        box:boxes!rentals_box_id_fkey (
          name
        )
      `)
      .eq('box_id', rental.stallplass_id)
      .eq('status', 'ACTIVE')
      .neq('id', rental.id)

    if (existingActiveRentals && existingActiveRentals.length > 0) {
      conflicts.push({
        id: `conflict-${Date.now()}-double-booking`,
        type: 'DOUBLE_BOOKING',
        rentalIds: [rental.id, ...existingActiveRentals.map(r => r.id)],
        boxId: rental.stallplass_id,
        stableId: rental.stall_id,
        severity: 'CRITICAL',
        description: `Attempting to activate rental ${rental.id} but box ${rental.stallplass_id} already has ${existingActiveRentals.length} active rental(s)`,
        detectedAt: new Date(),
        autoResolvable: false,
        metadata: {
          suggestedActions: [
            'Cancel one of the conflicting rentals',
            'Contact both parties to resolve manually',
            'Check if dates can be adjusted'
          ],
          impactedUsers: existingActiveRentals.map(r => r.leietaker_id)
        }
      })
    }
  }

  // Check box availability
  if (newStatus === 'ACTIVE') {
    const { data: boxData } = await supabase
      .from('boxes')
      .select('er_tilgjengelig')
      .eq('id', rental.stallplass_id)
      .single()

    if (boxData && !boxData.er_tilgjengelig) {
      conflicts.push({
        id: `conflict-${Date.now()}-box-unavailable`,
        type: 'BOX_UNAVAILABLE',
        rentalIds: [rental.id],
        boxId: rental.stallplass_id,
        stableId: rental.stall_id,
        severity: 'HIGH',
        description: `Box ${rental.stallplass_id} is marked as unavailable`,
        detectedAt: new Date(),
        autoResolvable: true,
        metadata: {
          suggestedActions: [
            'Mark box as available',
            'Contact stable owner',
            'Cancel rental if box is permanently unavailable'
          ]
        }
      })
    }
  }

  // Check for payment requirements
  if (newStatus === 'ACTIVE') {
    const { data: payments } = await supabase
      .from('payments')
      .select('status, total_belop')
      .eq('rental_id', rental.id)
      .eq('status', 'COMPLETED')

    if (!payments || payments.length === 0) {
      conflicts.push({
        id: `conflict-${Date.now()}-payment-pending`,
        type: 'PAYMENT_PENDING',
        rentalIds: [rental.id],
        boxId: rental.stallplass_id,
        stableId: rental.stall_id,
        severity: 'MEDIUM',
        description: `No completed payment found for rental ${rental.id}`,
        detectedAt: new Date(),
        autoResolvable: false,
        metadata: {
          suggestedActions: [
            'Wait for payment completion',
            'Contact renter about payment',
            'Process payment manually'
          ]
        }
      })
    }
  }

  return conflicts
}

/**
 * Resolve a rental conflict
 */
export async function resolveRentalConflict(
  conflictId: string,
  strategy: ConflictResolution['strategy'],
  executedBy: string,
  details: string
): Promise<ConflictResolution> {
  const resolution: ConflictResolution = {
    conflictId,
    strategy,
    executedBy,
    executedAt: new Date(),
    details,
    success: false
  }

  try {
    // Execute resolution strategy
    switch (strategy) {
      case 'CANCEL_CONFLICTING':
        // Implementation depends on conflict details
        // This would need to be passed the specific conflict data
        resolution.success = true
        break
        
      case 'ADJUST_DATES':
        // Implementation for date adjustment
        resolution.success = true
        break
        
      case 'MANUAL_REVIEW':
        // Mark for manual review
        resolution.success = true
        break
        
      case 'APPROVE_OVERRIDE':
        // Allow override with admin approval
        resolution.success = true
        break
    }

    // Log resolution
    await logConflictResolution(resolution)

    return resolution

  } catch (error) {
    resolution.success = false
    resolution.details += ` Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    return resolution
  }
}

/**
 * Auto-resolve simple conflicts
 */
export async function autoResolveConflicts(conflicts: RentalConflict[]): Promise<ConflictResolution[]> {
  const resolutions: ConflictResolution[] = []

  for (const conflict of conflicts) {
    if (!conflict.autoResolvable) continue

    let strategy: ConflictResolution['strategy']
    let details: string

    switch (conflict.type) {
      case 'BOX_UNAVAILABLE':
        strategy = 'MANUAL_REVIEW'
        details = 'Box availability needs manual verification'
        break
      
      default:
        continue // Skip non-auto-resolvable types
    }

    const resolution = await resolveRentalConflict(
      conflict.id,
      strategy,
      'system',
      details
    )

    resolutions.push(resolution)
  }

  return resolutions
}

/**
 * Get conflict history for a rental or box
 */
export async function getConflictHistory(): Promise<RentalConflict[]> {
  // This would typically be stored in a database table
  // For now, return empty array as this is a placeholder
  return []
}

/**
 * Log status transition
 */
async function logStatusTransition(transition: RentalStatusTransition): Promise<void> {
  try {
    // This would typically be stored in a database table for audit trail
    console.log('Status transition logged:', transition)
  } catch (error) {
    console.error('Failed to log status transition:', error)
  }
}

/**
 * Log conflict resolution
 */
async function logConflictResolution(resolution: ConflictResolution): Promise<void> {
  try {
    // This would typically be stored in a database table
    console.log('Conflict resolution logged:', resolution)
  } catch (error) {
    console.error('Failed to log conflict resolution:', error)
  }
}

/**
 * Subscribe to rental status changes with conflict detection
 */
export function subscribeToRentalStatusChangesWithConflicts(
  onStatusChange: (rental: Rental, conflicts?: RentalConflict[]) => void
): RealtimeChannel {
  const channel = supabase
    .channel('rental-status-changes-with-conflicts')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rentals'
      },
      async (payload) => {
        if (payload.old?.status !== payload.new?.status) {
          const rental = payload.new as Rental
          
          // Detect conflicts for the new status
          const conflicts = await detectStatusChangeConflicts(rental, rental.status as RentalStatus)
          
          onStatusChange(rental, conflicts.length > 0 ? conflicts : undefined)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Bulk status update with validation
 */
export async function bulkUpdateRentalStatus(
  updates: { rentalId: string; newStatus: RentalStatus; reason?: string }[],
  triggeredBy: string
): Promise<{
  successful: string[]
  failed: { rentalId: string; error: string }[]
  conflicts: RentalConflict[]
}> {
  const successful: string[] = []
  const failed: { rentalId: string; error: string }[] = []
  const allConflicts: RentalConflict[] = []

  for (const update of updates) {
    const result = await updateRentalStatusSafe(
      update.rentalId,
      update.newStatus,
      triggeredBy,
      update.reason
    )

    if (result.success) {
      successful.push(update.rentalId)
    } else {
      failed.push({ rentalId: update.rentalId, error: result.error || 'Unknown error' })
    }

    if (result.conflicts) {
      allConflicts.push(...result.conflicts)
    }
  }

  return { successful, failed, conflicts: allConflicts }
}

/**
 * Get rental status statistics
 */
export async function getRentalStatusStats(ownerId?: string): Promise<{
  byStatus: Record<RentalStatus, number>
  totalTransitions: number
  recentTransitions: number
  conflictRate: number
}> {
  let query = supabase
    .from('rentals')
    .select('status')

  if (ownerId) {
    query = query.eq('stable.eier_id', ownerId)
  }

  const { data: rentals } = await query

  const byStatus = rentals?.reduce((acc, rental) => {
    const status = rental.status as RentalStatus
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<RentalStatus, number>) || {} as Record<RentalStatus, number>

  // Ensure all statuses are represented
  const allStatuses: RentalStatus[] = ['ACTIVE', 'ENDED', 'CANCELLED']
  allStatuses.forEach(status => {
    if (!(status in byStatus)) {
      byStatus[status] = 0
    }
  })

  return {
    byStatus,
    totalTransitions: 0, // Would come from transition log
    recentTransitions: 0, // Would come from transition log
    conflictRate: 0 // Would be calculated from conflict history
  }
}

/**
 * Validate rental data before status change
 */
export async function validateRentalForStatusChange(
  rentalId: string,
  newStatus: RentalStatus
): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { data: rental } = await supabase
      .from('rentals')
      .select(`
        *,
        box:boxes!rentals_box_id_fkey (*),
        stable:stables!rentals_stall_id_fkey (*),
        rider:users!rentals_rider_id_fkey (*)
      `)
      .eq('id', rentalId)
      .single()

    if (!rental) {
      errors.push('Rental not found')
      return { valid: false, errors, warnings }
    }

    // Validate status transition
    if (!isValidStatusTransition(rental.status as RentalStatus, newStatus)) {
      errors.push(`Invalid status transition from ${rental.status} to ${newStatus}`)
    }

    // Validate box exists and is available
    if (!rental.box) {
      errors.push('Associated box not found')
    } else if (!rental.box.er_tilgjengelig && newStatus === 'ACTIVE') {
      warnings.push('Box is marked as unavailable')
    }

    // Validate stable exists
    if (!rental.stable) {
      errors.push('Associated stable not found')
    }

    // Validate rider exists
    if (!rental.rider) {
      errors.push('Associated rider not found')
    }

    // Validate dates
    if (newStatus === 'ACTIVE') {
      const now = new Date()
      const startDate = new Date(rental.start_dato)
      
      if (startDate > now) {
        warnings.push('Start date is in the future')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }

  } catch {
    errors.push('Validation failed due to database error')
    return { valid: false, errors, warnings }
  }
}