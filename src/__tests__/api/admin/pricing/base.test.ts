import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/admin/pricing/base/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    basePrice: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock Firebase admin
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
  }),
  apps: [],
  initializeApp: jest.fn(),
}))

// Mock admin service
jest.mock('@/services/admin-service', () => ({
  checkUserIsAdmin: jest.fn(),
  requireAdmin: jest.fn(),
}))

// Mock our Firebase admin wrapper
jest.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: jest.fn(),
}))

import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { checkUserIsAdmin } from '@/services/admin-service'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockVerifyFirebaseToken = verifyFirebaseToken as jest.MockedFunction<typeof verifyFirebaseToken>
const mockCheckUserIsAdmin = checkUserIsAdmin as jest.MockedFunction<typeof checkUserIsAdmin>

describe('/api/admin/pricing/base', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT', () => {
    it('should update base price successfully', async () => {
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

      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockPrisma.basePrice.findFirst.mockResolvedValue(existingBasePrice)
      mockPrisma.basePrice.update.mockResolvedValue(updatedBasePrice)

      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 15 }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(updatedBasePrice)
      expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('valid-token')
      expect(mockPrisma.basePrice.findFirst).toHaveBeenCalledWith({
        where: { name: 'monthly' }
      })
      expect(mockPrisma.basePrice.update).toHaveBeenCalledWith({
        where: { id: 'base-price-1' },
        data: { price: 15 }
      })
    })

    it('should create base price when none exists', async () => {
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

      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockPrisma.basePrice.findFirst.mockResolvedValue(null)
      mockPrisma.basePrice.create.mockResolvedValue(newBasePrice)

      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 12 }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(newBasePrice)
      expect(mockPrisma.basePrice.create).toHaveBeenCalledWith({
        data: {
          name: 'monthly',
          price: 12,
          description: 'Månedlig grunnpris per boks',
          isActive: true,
        }
      })
    })

    it('should return 401 when no authorization header', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 15 }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 when invalid token', async () => {
      // Arrange
      mockVerifyFirebaseToken.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 15 }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Invalid token' })
    })

    it('should return 400 when price is missing', async () => {
      // Arrange
      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Price is required' })
    })

    it('should handle database errors', async () => {
      // Arrange
      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockPrisma.basePrice.findFirst.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 15 }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
    })
  })
})