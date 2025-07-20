import { renderHook, waitFor } from '@testing-library/react'
import { useRealTimeRentals } from '@/hooks/useRealTimeRentals'
import * as rentalService from '@/services/rental-service'

// Mock the rental service
jest.mock('@/services/rental-service', () => ({
  getStableOwnerRentals: jest.fn(),
  getStableOwnerRentalStats: jest.fn(),
  subscribeToStableOwnerRentals: jest.fn(),
  subscribeToRentalStatusChanges: jest.fn(),
  subscribeToNewRentalRequests: jest.fn(),
  unsubscribeFromRentalChannel: jest.fn()
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    })),
    removeChannel: jest.fn()
  }
}))

const mockRentalData = [
  {
    id: '1',
    stable_id: 'stable-1',
    box_id: 'box-1',
    rider_id: 'rider-1',
    conversation_id: 'conv-1',
    start_date: '2023-01-01',
    end_date: null,
    monthly_price: 5000,
    status: 'ACTIVE',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    stable: {
      id: 'stable-1',
      name: 'Test Stall',
      owner_id: 'owner-1'
    },
    box: {
      id: 'box-1',
      name: 'Boks 1',
      monthly_price: 5000
    },
    rider: {
      id: 'rider-1',
      name: 'Test Leietaker',
      email: 'rider@test.com'
    },
    conversation: {
      id: 'conv-1',
      status: 'ACTIVE'
    }
  }
]

const mockStats = {
  totalRentals: 5,
  activeRentals: 2,
  pendingRentals: 1,
  monthlyRevenue: 10000
}

describe('useRealTimeRentals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(rentalService.getStableOwnerRentals as jest.Mock).mockResolvedValue(mockRentalData)
    ;(rentalService.getStableOwnerRentalStats as jest.Mock).mockResolvedValue(mockStats)
    ;(rentalService.subscribeToStableOwnerRentals as jest.Mock).mockReturnValue({
      unsubscribe: jest.fn()
    })
    ;(rentalService.subscribeToRentalStatusChanges as jest.Mock).mockReturnValue({
      unsubscribe: jest.fn()
    })
    ;(rentalService.subscribeToNewRentalRequests as jest.Mock).mockReturnValue({
      unsubscribe: jest.fn()
    })
  })

  it('should load initial rental data', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true 
      })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.rentals).toEqual(mockRentalData)
    expect(rentalService.getStableOwnerRentals).toHaveBeenCalledWith('owner-1')
  })

  it('should load analytics when trackAnalytics is enabled', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true,
        trackAnalytics: true
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.analytics).toBeDefined()
    expect(result.current.analytics?.totalRentals).toBe(5)
    expect(result.current.analytics?.activeRentals).toBe(2)
    expect(result.current.analytics?.monthlyRevenue).toBe(10000)
    expect(rentalService.getStableOwnerRentalStats).toHaveBeenCalledWith('owner-1')
  })

  it('should set up real-time subscriptions when enabled', async () => {
    renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true 
      })
    )

    await waitFor(() => {
      expect(rentalService.subscribeToStableOwnerRentals).toHaveBeenCalledWith(
        'owner-1',
        expect.any(Function)
      )
      expect(rentalService.subscribeToRentalStatusChanges).toHaveBeenCalledWith(
        expect.any(Function)
      )
      expect(rentalService.subscribeToNewRentalRequests).toHaveBeenCalledWith(
        'owner-1',
        expect.any(Function)
      )
    })
  })

  it('should not load data when disabled', () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: false 
      })
    )

    expect(result.current.isLoading).toBe(true)
    expect(rentalService.getStableOwnerRentals).not.toHaveBeenCalled()
  })

  it('should not load data when ownerId is not provided', () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        enabled: true 
      })
    )

    expect(result.current.isLoading).toBe(true)
    expect(rentalService.getStableOwnerRentals).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to load rentals')
    ;(rentalService.getStableOwnerRentals as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true 
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load rentals')
  })

  it('should provide helper methods', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true 
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Test getActiveRentalsForBox
    const activeRentals = result.current.getActiveRentalsForBox('box-1')
    expect(activeRentals).toHaveLength(1)
    expect(activeRentals[0].id).toBe('1')

    // Test getRentalsByStatus
    const activeByStatus = result.current.getRentalsByStatus('ACTIVE')
    expect(activeByStatus).toHaveLength(1)
    expect(activeByStatus[0].status).toBe('ACTIVE')

    // Test refresh method
    expect(typeof result.current.refresh).toBe('function')
    expect(typeof result.current.resolveConflict).toBe('function')
  })

  it('should detect conflicts when enabled', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true,
        detectConflicts: true
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.conflicts).toBeDefined()
    expect(Array.isArray(result.current.conflicts)).toBe(true)
  })

  it('should track lifecycle events', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true 
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.lifecycleEvents).toBeDefined()
    expect(Array.isArray(result.current.lifecycleEvents)).toBe(true)
  })

  it('should calculate analytics correctly', async () => {
    const { result } = renderHook(() => 
      useRealTimeRentals({ 
        ownerId: 'owner-1', 
        enabled: true,
        trackAnalytics: true
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const analytics = result.current.analytics
    expect(analytics).toBeDefined()
    expect(analytics?.conversionRate).toBeGreaterThanOrEqual(0)
    expect(analytics?.conversionRate).toBeLessThanOrEqual(100)
    expect(analytics?.recentTrends).toBeDefined()
    expect(analytics?.recentTrends.period).toBeDefined()
  })
})