import { createOrUpdateBasePrice, getBasePriceObject, getAllDiscounts } from '@/services/pricing-service'
import { supabase } from '@/lib/supabase'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Pricing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrUpdateBasePrice', () => {
    it('should update existing base price when one exists', async () => {
      // Arrange
      const existingBasePrice = {
        id: 'base-price-1',
        name: 'monthly',
        price: 10,
        description: 'Månedlig grunnpris per boks',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedBasePrice = {
        ...existingBasePrice,
        price: 15,
        updated_at: new Date().toISOString(),
      }

      // Mock the first query (find existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingBasePrice, error: null }),
      } as any)
      
      // Mock the update query
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedBasePrice, error: null }),
      } as any)

      // Act
      const result = await createOrUpdateBasePrice(15)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('base_prices')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for find, once for update
      expect(result).toEqual(updatedBasePrice)
    })

    it('should create new base price when none exists', async () => {
      // Arrange
      const newBasePrice = {
        id: 'base-price-new',
        name: 'monthly',
        price: 12,
        description: 'Månedlig grunnpris per boks',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Mock the first query (find existing) - returns null/error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      } as any)
      
      // Mock the insert query
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newBasePrice, error: null }),
      } as any)

      // Act
      const result = await createOrUpdateBasePrice(12)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('base_prices')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for find, once for insert
      expect(result).toEqual(newBasePrice)
    })

    it('should handle database errors properly', async () => {
      // Arrange
      // Mock database error on first query (finding existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      } as any)
      
      // Mock database error on insert query
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
      } as any)

      // Act & Assert
      await expect(createOrUpdateBasePrice(10)).rejects.toThrow('Failed to create base price: Database connection failed')
    })
  })

  describe('getBasePriceObject', () => {
    it('should return base price when it exists', async () => {
      // Arrange
      const basePrice = {
        id: 'base-price-1',
        name: 'monthly',
        price: 10,
        description: 'Månedlig grunnpris per boks',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: basePrice, error: null }),
      } as any)

      // Act
      const result = await getBasePriceObject()

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('base_prices')
      expect(result).toEqual(basePrice)
    })

    it('should return null when no base price exists', async () => {
      // Arrange
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      } as any)

      // Act
      const result = await getBasePriceObject()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getAllDiscounts', () => {
    it('should return all active discounts sorted by months', async () => {
      // Arrange
      const discounts = [
        {
          id: 'discount-3',
          months: 6,
          percentage: 0.12,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'discount-1',
          months: 1,
          percentage: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'discount-2',
          months: 3,
          percentage: 0.05,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: discounts, error: null }),
      } as any)

      // Act
      const result = await getAllDiscounts()

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_discounts')
      expect(result).toEqual(discounts)
    })

    it('should return empty array when no discounts exist', async () => {
      // Arrange
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      // Act
      const result = await getAllDiscounts()

      // Assert
      expect(result).toEqual([])
    })
  })
})