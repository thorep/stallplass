import { http, HttpResponse } from 'msw'
import { BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@prisma/client'

// Mock data
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

const mockStableAmenities: StableAmenity[] = [
  {
    id: 'amenity-1',
    name: 'Ridehall',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'amenity-2',
    name: 'Utebane',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockBoxAmenities: BoxAmenity[] = [
  {
    id: 'box-amenity-1',
    name: 'Strøm',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'box-amenity-2',
    name: 'Vann',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// API handlers
export const handlers = [
  // Admin Pricing Routes
  http.get('/api/admin/pricing/base', () => {
    return HttpResponse.json(mockBasePrice)
  }),

  http.put('/api/admin/pricing/base', async ({ request }) => {
    const { price } = await request.json() as { price: number }
    return HttpResponse.json({
      ...mockBasePrice,
      price,
      updatedAt: new Date(),
    })
  }),

  http.get('/api/admin/pricing/discounts', () => {
    return HttpResponse.json(mockDiscounts)
  }),

  http.post('/api/admin/pricing/discounts', async ({ request }) => {
    const discount = await request.json() as Omit<PricingDiscount, 'id' | 'createdAt' | 'updatedAt'>
    return HttpResponse.json({
      ...discount,
      id: `discount-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }),

  // Admin Amenities Routes
  http.get('/api/admin/amenities/stable', () => {
    return HttpResponse.json(mockStableAmenities)
  }),

  http.post('/api/admin/amenities/stable', async ({ request }) => {
    const { name } = await request.json() as { name: string }
    return HttpResponse.json({
      id: `amenity-${Date.now()}`,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }),

  http.get('/api/admin/amenities/box', () => {
    return HttpResponse.json(mockBoxAmenities)
  }),

  http.post('/api/admin/amenities/box', async ({ request }) => {
    const { name } = await request.json() as { name: string }
    return HttpResponse.json({
      id: `box-amenity-${Date.now()}`,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }),

  // Error handling examples
  http.get('/api/admin/pricing/base-error', () => {
    return HttpResponse.json(
      { error: 'No base price found to update' },
      { status: 404 }
    )
  }),

  http.put('/api/admin/pricing/base-error', () => {
    return HttpResponse.json(
      { error: 'Failed to update base price' },
      { status: 500 }
    )
  }),

  // Empty data scenarios
  http.get('/api/admin/amenities/stable-empty', () => {
    return HttpResponse.json([])
  }),

  http.get('/api/admin/pricing/discounts-empty', () => {
    return HttpResponse.json([])
  }),
]