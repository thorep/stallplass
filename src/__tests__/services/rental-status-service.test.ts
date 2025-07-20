import {
  isValidStatusTransition,
  getPossibleNextStatuses,
  updateRentalStatusSafe,
  detectStatusChangeConflicts,
  validateRentalForStatusChange,
  STATUS_TRANSITIONS
} from '@/services/rental-status-service'
import * as rentalService from '@/services/rental-service'
import { supabase } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/services/rental-service')
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          neq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

const mockRental = {
  id: '1',
  stable_id: 'stable-1',
  box_id: 'box-1',
  rider_id: 'rider-1',
  conversation_id: 'conv-1',
  start_date: '2023-01-01',
  end_date: null,
  monthly_price: 5000,
  status: 'PENDING',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('rental-status-service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Status Transitions', () => {
    it('should have correct status transition rules', () => {
      expect(STATUS_TRANSITIONS).toEqual({
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['ACTIVE', 'CANCELLED'],
        ACTIVE: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: []
      })
    })

    it('should validate valid status transitions', () => {
      expect(isValidStatusTransition('PENDING', 'CONFIRMED')).toBe(true)
      expect(isValidStatusTransition('PENDING', 'CANCELLED')).toBe(true)
      expect(isValidStatusTransition('CONFIRMED', 'ACTIVE')).toBe(true)
      expect(isValidStatusTransition('ACTIVE', 'COMPLETED')).toBe(true)
    })

    it('should reject invalid status transitions', () => {
      expect(isValidStatusTransition('PENDING', 'ACTIVE')).toBe(false)
      expect(isValidStatusTransition('COMPLETED', 'ACTIVE')).toBe(false)
      expect(isValidStatusTransition('CANCELLED', 'ACTIVE')).toBe(false)
    })

    it('should return possible next statuses', () => {
      expect(getPossibleNextStatuses('PENDING')).toEqual(['CONFIRMED', 'CANCELLED'])
      expect(getPossibleNextStatuses('CONFIRMED')).toEqual(['ACTIVE', 'CANCELLED'])
      expect(getPossibleNextStatuses('ACTIVE')).toEqual(['COMPLETED', 'CANCELLED'])
      expect(getPossibleNextStatuses('COMPLETED')).toEqual([])
      expect(getPossibleNextStatuses('CANCELLED')).toEqual([])
    })
  })

  describe('updateRentalStatusSafe', () => {
    beforeEach(() => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRental, error: null })
          })
        })
      })
      ;(rentalService.updateRentalStatus as jest.Mock).mockResolvedValue({
        ...mockRental,
        status: 'CONFIRMED'
      })
    })

    it('should successfully update valid status transition', async () => {
      const result = await updateRentalStatusSafe(
        '1',
        'CONFIRMED',
        'owner-1',
        'Manual confirmation'
      )

      expect(result.success).toBe(true)
      expect(result.rental?.status).toBe('CONFIRMED')
      expect(rentalService.updateRentalStatus).toHaveBeenCalledWith('1', 'CONFIRMED')
    })

    it('should reject invalid status transition', async () => {
      const result = await updateRentalStatusSafe(
        '1',
        'ACTIVE',
        'owner-1',
        'Invalid transition'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid status transition')
      expect(rentalService.updateRentalStatus).not.toHaveBeenCalled()
    })

    it('should handle rental not found', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
          })
        })
      })

      const result = await updateRentalStatusSafe('999', 'CONFIRMED', 'owner-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rental not found')
    })

    it('should block updates when critical conflicts exist', async () => {
      // Mock detectStatusChangeConflicts to return critical conflict
      const mockDetectConflicts = jest.fn().mockResolvedValue([
        {
          id: 'conflict-1',
          type: 'DOUBLE_BOOKING',
          severity: 'CRITICAL',
          autoResolvable: false
        }
      ])

      // Replace the original function temporarily
      const originalDetect = require('@/services/rental-status-service').detectStatusChangeConflicts
      require('@/services/rental-status-service').detectStatusChangeConflicts = mockDetectConflicts

      const result = await updateRentalStatusSafe('1', 'CONFIRMED', 'owner-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Critical conflicts detected')
      expect(result.conflicts).toHaveLength(1)

      // Restore original function
      require('@/services/rental-status-service').detectStatusChangeConflicts = originalDetect
    })
  })

  describe('detectStatusChangeConflicts', () => {
    beforeEach(() => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      })
    })

    it('should detect no conflicts for normal status change', async () => {
      const conflicts = await detectStatusChangeConflicts(mockRental, 'CONFIRMED')
      expect(conflicts).toHaveLength(0)
    })

    it('should detect double booking conflict', async () => {
      // Mock existing active rental for same box
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockResolvedValue({
              data: [{ id: '2', rider_id: 'rider-2' }],
              error: null
            })
          })
        })
      })

      const conflicts = await detectStatusChangeConflicts(mockRental, 'ACTIVE')
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('DOUBLE_BOOKING')
      expect(conflicts[0].severity).toBe('CRITICAL')
    })

    it('should detect box unavailability conflict', async () => {
      // Mock box as unavailable
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_available: false },
              error: null
            }),
            neq: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      }

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'boxes') {
          return mockQuery
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }
      })

      const conflicts = await detectStatusChangeConflicts(mockRental, 'ACTIVE')
      
      expect(conflicts.some(c => c.type === 'BOX_UNAVAILABLE')).toBe(true)
    })

    it('should detect payment pending conflict', async () => {
      // Mock no completed payments
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            neq: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      }

      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'payments') {
          return mockQuery
        }
        if (table === 'boxes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { is_available: true },
                  error: null
                })
              })
            })
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }
      })

      const conflicts = await detectStatusChangeConflicts(mockRental, 'ACTIVE')
      
      expect(conflicts.some(c => c.type === 'PAYMENT_PENDING')).toBe(true)
    })
  })

  describe('validateRentalForStatusChange', () => {
    beforeEach(() => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockRental,
                box: { id: 'box-1', is_available: true },
                stable: { id: 'stable-1' },
                rider: { id: 'rider-1' }
              },
              error: null
            })
          })
        })
      })
    })

    it('should validate successful rental data', async () => {
      const result = await validateRentalForStatusChange('1', 'CONFIRMED')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid status transition', async () => {
      const result = await validateRentalForStatusChange('1', 'ACTIVE')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid status transition from PENDING to ACTIVE')
    })

    it('should detect missing rental', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })

      const result = await validateRentalForStatusChange('999', 'CONFIRMED')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Rental not found')
    })

    it('should warn about unavailable box', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockRental,
                box: { id: 'box-1', is_available: false },
                stable: { id: 'stable-1' },
                rider: { id: 'rider-1' }
              },
              error: null
            })
          })
        })
      })

      const result = await validateRentalForStatusChange('1', 'CONFIRMED')
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Box is marked as unavailable')
    })

    it('should warn about future start date for active status', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockRental,
                start_date: futureDate.toISOString(),
                box: { id: 'box-1', is_available: true },
                stable: { id: 'stable-1' },
                rider: { id: 'rider-1' }
              },
              error: null
            })
          })
        })
      })

      const result = await validateRentalForStatusChange('1', 'ACTIVE')
      
      expect(result.warnings).toContain('Start date is in the future')
    })
  })
})