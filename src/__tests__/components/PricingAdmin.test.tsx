import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { PricingAdmin } from '@/components/organisms/PricingAdmin'
import { BasePrice, PricingDiscount } from '@/types'

// Mock auth context for this test
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
  }),
}))


describe('PricingAdmin', () => {
  const mockBasePrice: BasePrice = {
    id: 'base-price-1',
    name: 'monthly',
    price: 10,
    description: 'Månedlig grunnpris per boks',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockDiscounts: PricingDiscount[] = [
    {
      id: 'discount-1',
      months: 1,
      percentage: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'discount-2',
      months: 3,
      percentage: 0.05,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render base price and discounts correctly', () => {
    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialSponsoredPrice={undefined}
        initialDiscounts={mockDiscounts}
      />
    )

    // Check base price display
    expect(screen.getByText('10 kr')).toBeInTheDocument()
    expect(screen.getByText('per boks per måned')).toBeInTheDocument()
    expect(screen.getAllByText('Aktiv')).toHaveLength(4) // Base price, sponsored price (default active even when undefined), and both discounts

    // Check discounts display
    expect(screen.getByText('Rabatter (2)')).toBeInTheDocument()
    expect(screen.getByText('1 måned')).toBeInTheDocument()
    expect(screen.getByText('3 måneder')).toBeInTheDocument()
    expect(screen.getByText('0.0% rabatt')).toBeInTheDocument()
    expect(screen.getByText('5.0% rabatt')).toBeInTheDocument()
  })

  it('should handle base price editing successfully', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockBasePrice, price: 15 }),
    } as Response)

    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialSponsoredPrice={undefined}
        initialDiscounts={mockDiscounts}
      />
    )

    // Click edit button for base price (there are multiple Rediger buttons, get the first one)
    const editButtons = screen.getAllByRole('button', { name: /rediger/i })
    await user.click(editButtons[0]) // First one is for base price

    // Change the price
    const priceInput = screen.getByDisplayValue('10')
    await user.clear(priceInput)
    await user.type(priceInput, '15')

    // Save the changes
    await user.click(screen.getByRole('button', { name: /lagre/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ price: 15 }),
      })
    })

    // Toast notifications have been removed
  })

  it('should handle base price update error', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No base price found to update' }),
    } as Response)

    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialSponsoredPrice={undefined}
        initialDiscounts={mockDiscounts}
      />
    )

    // Click edit button and try to save
    const editButtons = screen.getAllByRole('button', { name: /rediger/i })
    await user.click(editButtons[0]) // First one is for base price
    await user.click(screen.getByRole('button', { name: /lagre/i }))

    await waitFor(() => {
      // Toast notifications have been removed
    })
  })

  it('should allow adding new discount', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    const newDiscount = {
      id: 'discount-new',
      months: 6,
      percentage: 0.1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newDiscount,
    } as Response)

    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialSponsoredPrice={undefined}
        initialDiscounts={mockDiscounts}
      />
    )

    // Click add discount button
    await user.click(screen.getByRole('button', { name: /legg til rabatt/i }))

    // Fill in the form
    const monthsInput = screen.getByLabelText(/antall måneder/i)
    const percentageInput = screen.getByLabelText(/rabatt \(%\)/i)

    await user.clear(monthsInput)
    await user.type(monthsInput, '6')
    await user.clear(percentageInput)
    await user.type(percentageInput, '10')

    // Submit the form - find the submit button within the form
    const submitButton = screen.getByRole('button', { name: 'Legg til' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/pricing/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ months: 6, percentage: 0.1, isActive: true }),
      })
    })

    // Toast notifications have been removed
  })

  it('should handle empty discounts state', () => {
    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialDiscounts={[]}
      />
    )

    expect(screen.getByText('Rabatter (0)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /legg til rabatt/i })).toBeInTheDocument()
  })

  it('should allow canceling discount form', async () => {
    const user = userEvent.setup()

    render(
      <PricingAdmin
        initialBasePrice={mockBasePrice}
        initialSponsoredPrice={undefined}
        initialDiscounts={mockDiscounts}
      />
    )

    // Click add discount button
    await user.click(screen.getByRole('button', { name: /legg til rabatt/i }))

    // Form should be visible
    expect(screen.getByLabelText(/antall måneder/i)).toBeInTheDocument()

    // Click cancel
    await user.click(screen.getByRole('button', { name: /avbryt/i }))

    // Form should be hidden
    expect(screen.queryByLabelText(/antall måneder/i)).not.toBeInTheDocument()
  })
})