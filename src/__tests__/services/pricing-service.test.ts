import { createOrUpdateBasePrice, getBasePriceObject, getAllDiscounts } from '@/services/pricing-service'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    basePrice: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pricingDiscount: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedBasePrice = {
        ...existingBasePrice,
        price: 15,
        updatedAt: new Date(),
      }

      mockPrisma.basePrice.findFirst.mockResolvedValue(existingBasePrice)
      mockPrisma.basePrice.update.mockResolvedValue(updatedBasePrice)

      // Act
      const result = await createOrUpdateBasePrice(15)

      // Assert
      expect(mockPrisma.basePrice.findFirst).toHaveBeenCalledWith({
        where: { name: 'monthly' }
      })
      expect(mockPrisma.basePrice.update).toHaveBeenCalledWith({
        where: { id: 'base-price-1' },
        data: { price: 15 }
      })
      expect(result).toEqual(updatedBasePrice)
    })

    it('should create new base price when none exists', async () => {
      // Arrange
      const newBasePrice = {
        id: 'base-price-new',
        name: 'monthly',
        price: 12,
        description: 'Månedlig grunnpris per boks',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.basePrice.findFirst.mockResolvedValue(null)
      mockPrisma.basePrice.create.mockResolvedValue(newBasePrice)

      // Act
      const result = await createOrUpdateBasePrice(12)

      // Assert
      expect(mockPrisma.basePrice.findFirst).toHaveBeenCalledWith({
        where: { name: 'monthly' }
      })
      expect(mockPrisma.basePrice.create).toHaveBeenCalledWith({
        data: {
          name: 'monthly',
          price: 12,
          description: 'Månedlig grunnpris per boks',
          isActive: true,
        }
      })
      expect(result).toEqual(newBasePrice)
    })

    it('should handle database errors properly', async () => {
      // Arrange
      const dbError = new Error('Database connection failed')
      mockPrisma.basePrice.findFirst.mockRejectedValue(dbError)

      // Act & Assert
      await expect(createOrUpdateBasePrice(10)).rejects.toThrow('Database connection failed')
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.basePrice.findFirst.mockResolvedValue(basePrice)

      // Act
      const result = await getBasePriceObject()

      // Assert
      expect(mockPrisma.basePrice.findFirst).toHaveBeenCalledWith({
        where: { isActive: true }
      })
      expect(result).toEqual(basePrice)
    })

    it('should return null when no base price exists', async () => {
      // Arrange
      mockPrisma.basePrice.findFirst.mockResolvedValue(null)

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
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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

      mockPrisma.pricingDiscount.findMany.mockResolvedValue(discounts)

      // Act
      const result = await getAllDiscounts()

      // Assert
      expect(mockPrisma.pricingDiscount.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { months: 'asc' }
      })
      expect(result).toEqual(discounts)
    })

    it('should return empty array when no discounts exist', async () => {
      // Arrange
      mockPrisma.pricingDiscount.findMany.mockResolvedValue([])

      // Act
      const result = await getAllDiscounts()

      // Assert
      expect(result).toEqual([])
    })
  })
})