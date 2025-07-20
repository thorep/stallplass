import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/lib/auth-context'
import { useRealTimeRentals } from '@/hooks/useRealTimeRentals'
import { updateRentalStatusSafe } from '@/services/rental-status-service'
import RealTimeRentalDashboard from '@/components/organisms/RealTimeRentalDashboard'

// Mock dependencies
jest.mock('@/lib/auth-context')
jest.mock('@/hooks/useRealTimeRentals')
jest.mock('@/services/rental-status-service')

const mockUser = {
  uid: 'owner-1',
  email: 'owner@test.com'
}

const mockRentals = [
  {
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
    updated_at: '2023-01-01T00:00:00Z',
    stable: { id: 'stable-1', name: 'Test Stall', owner_id: 'owner-1' },
    box: { id: 'box-1', name: 'Boks 1', monthly_price: 5000 },
    rider: { id: 'rider-1', name: 'Test Leietaker', email: 'rider@test.com' },
    conversation: { id: 'conv-1', status: 'ACTIVE' }
  }
]

const mockAnalytics = {
  totalRentals: 5,
  activeRentals: 2,
  pendingRentals: 1,
  monthlyRevenue: 10000,
  conversionRate: 40,
  averageRentalDuration: 30,
  cancellationRate: 10,
  recentTrends: {
    newRequests: 3,
    confirmations: 2,
    cancellations: 1,
    period: 'month'
  }
}

const mockHookReturn = {
  rentals: mockRentals,
  analytics: mockAnalytics,
  conflicts: [],
  lifecycleEvents: [],
  isLoading: false,
  error: null,
  refresh: jest.fn(),
  resolveConflict: jest.fn(),
  getActiveRentalsForBox: jest.fn(),
  getRentalsByStatus: jest.fn()
}

describe('RealTimeRentalDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    ;(useRealTimeRentals as jest.Mock).mockReturnValue(mockHookReturn)
    ;(updateRentalStatusSafe as jest.Mock).mockResolvedValue({
      success: true,
      rental: { ...mockRentals[0], status: 'CONFIRMED' }
    })
  })

  it('should render dashboard with analytics cards', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    expect(screen.getByText('Leieforvaltning')).toBeInTheDocument()
    expect(screen.getByText('Totale leieforhold')).toBeInTheDocument()
    expect(screen.getByText('Aktive leieforhold')).toBeInTheDocument()
    expect(screen.getByText('Ventende forespørsler')).toBeInTheDocument()
    expect(screen.getByText('Månedlig inntekt')).toBeInTheDocument()
  })

  it('should display correct analytics values', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    expect(screen.getByText('5')).toBeInTheDocument() // Total rentals
    expect(screen.getByText('2')).toBeInTheDocument() // Active rentals
    expect(screen.getByText('1')).toBeInTheDocument() // Pending rentals
    expect(screen.getByText('10.000 kr')).toBeInTheDocument() // Monthly revenue
  })

  it('should show loading state', () => {
    ;(useRealTimeRentals as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      isLoading: true
    })

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
  })

  it('should show error state', () => {
    const errorMessage = 'Failed to load data'
    ;(useRealTimeRentals as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      isLoading: false,
      error: errorMessage
    })

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    expect(screen.getByText('Feil ved lasting av data')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should allow tab navigation', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Click on rentals tab
    fireEvent.click(screen.getByText('Leieforhold'))
    expect(screen.getByText('Alle leieforhold')).toBeInTheDocument()

    // Click on conflicts tab
    fireEvent.click(screen.getByText('Konflikter'))
    expect(screen.getByText('Ingen konflikter')).toBeInTheDocument()

    // Click on analytics tab
    fireEvent.click(screen.getByText('Analyse'))
    expect(screen.getByText('Konverteringsrate')).toBeInTheDocument()
  })

  it('should display rentals in table format', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to rentals tab
    fireEvent.click(screen.getByText('Leieforhold'))

    expect(screen.getByText('Test Leietaker')).toBeInTheDocument()
    expect(screen.getByText('Test Stall')).toBeInTheDocument()
    expect(screen.getByText('Boks 1')).toBeInTheDocument()
    expect(screen.getByText('5.000 kr')).toBeInTheDocument()
  })

  it('should allow status updates for pending rentals', async () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to rentals tab
    fireEvent.click(screen.getByText('Leieforhold'))

    // Find and click approve button
    const approveButton = screen.getByText('Godkjenn')
    expect(approveButton).toBeInTheDocument()

    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(updateRentalStatusSafe).toHaveBeenCalledWith(
        '1',
        'CONFIRMED',
        'owner-1',
        'Godkjent av eier'
      )
    })
  })

  it('should allow status updates for confirmed rentals', async () => {
    const confirmedRental = { ...mockRentals[0], status: 'CONFIRMED' }
    ;(useRealTimeRentals as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      rentals: [confirmedRental]
    })

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to rentals tab
    fireEvent.click(screen.getByText('Leieforhold'))

    // Find and click start rental button
    const startButton = screen.getByText('Start leie')
    expect(startButton).toBeInTheDocument()

    fireEvent.click(startButton)

    await waitFor(() => {
      expect(updateRentalStatusSafe).toHaveBeenCalledWith(
        '1',
        'ACTIVE',
        'owner-1',
        'Startet av eier'
      )
    })
  })

  it('should display conflicts when present', () => {
    const conflictsData = [
      {
        id: 'conflict-1',
        type: 'DOUBLE_BOOKING',
        severity: 'CRITICAL',
        description: 'Multiple active rentals for same box',
        autoResolvable: false,
        metadata: {
          suggestedActions: ['Cancel one rental', 'Contact parties']
        }
      }
    ]

    ;(useRealTimeRentals as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      conflicts: conflictsData
    })

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to conflicts tab
    fireEvent.click(screen.getByText('Konflikter'))

    expect(screen.getByText('DOUBLE_BOOKING - CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('Multiple active rentals for same box')).toBeInTheDocument()
    expect(screen.getByText('Cancel one rental')).toBeInTheDocument()
  })

  it('should handle conflict resolution', async () => {
    const conflictsData = [
      {
        id: 'conflict-1',
        type: 'DOUBLE_BOOKING',
        severity: 'CRITICAL',
        description: 'Multiple active rentals for same box',
        autoResolvable: true
      }
    ]

    ;(useRealTimeRentals as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      conflicts: conflictsData
    })

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to conflicts tab
    fireEvent.click(screen.getByText('Konflikter'))

    // Click auto-resolve button
    const autoResolveButton = screen.getByText('Auto-løs')
    fireEvent.click(autoResolveButton)

    await waitFor(() => {
      expect(mockHookReturn.resolveConflict).toHaveBeenCalledWith(
        'conflict-1',
        'Resolved using auto'
      )
    })
  })

  it('should display analytics metrics', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to analytics tab
    fireEvent.click(screen.getByText('Analyse'))

    expect(screen.getByText('Konverteringsrate')).toBeInTheDocument()
    expect(screen.getByText('40.0%')).toBeInTheDocument()
    expect(screen.getByText('Trender denne måneden')).toBeInTheDocument()
    expect(screen.getByText('Inntektsfordeling')).toBeInTheDocument()
  })

  it('should call refresh when refresh button is clicked', () => {
    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    const refreshButton = screen.getByText('Oppdater')
    fireEvent.click(refreshButton)

    expect(mockHookReturn.refresh).toHaveBeenCalled()
  })

  it('should handle status update errors', async () => {
    ;(updateRentalStatusSafe as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid transition'
    })

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<RealTimeRentalDashboard ownerId="owner-1" />)

    // Switch to rentals tab
    fireEvent.click(screen.getByText('Leieforhold'))

    // Click approve button
    const approveButton = screen.getByText('Godkjenn')
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to update status: Invalid transition')
    })

    alertSpy.mockRestore()
  })

})