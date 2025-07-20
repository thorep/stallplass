import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/admin/pricing/base/route'
import { supabase } from '@/lib/supabase'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
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

const mockSupabase = supabase as jest.Mocked<typeof supabase>
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
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedBasePrice = {
        ...existingBasePrice,
        price: 15,
        updated_at: new Date().toISOString(),
      }

      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockCheckUserIsAdmin.mockResolvedValue(true)
      
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
      expect(data).toEqual(expect.objectContaining({
        id: updatedBasePrice.id,
        name: updatedBasePrice.name,
        price: updatedBasePrice.price,
        description: updatedBasePrice.description,
        is_active: updatedBasePrice.is_active,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }))
      expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('valid-token')
      expect(mockSupabase.from).toHaveBeenCalledWith('base_prices')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for find, once for update
    })

    it('should create base price when none exists', async () => {
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

      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      mockCheckUserIsAdmin.mockResolvedValue(true)
      
      // Mock the first query (find existing) - returns null
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
      expect(data).toEqual(expect.objectContaining({
        id: newBasePrice.id,
        name: newBasePrice.name,
        price: newBasePrice.price,
        description: newBasePrice.description,
        is_active: newBasePrice.is_active,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }))
      expect(mockSupabase.from).toHaveBeenCalledWith('base_prices')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for find, once for insert
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
      expect(data).toEqual({ error: 'Unauthorized: Admin access required' })
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
      expect(data).toEqual({ error: 'Unauthorized: Admin access required' })
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
      expect(data).toEqual({ error: 'Price is required and must be a positive number' })
    })

    it('should handle database errors', async () => {
      // Arrange
      mockVerifyFirebaseToken.mockResolvedValue({ uid: 'admin-user' })
      mockCheckUserIsAdmin.mockResolvedValue(true)
      
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      } as any)

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
      expect(data).toEqual({ error: 'Failed to update base price' })
    })
  })
})