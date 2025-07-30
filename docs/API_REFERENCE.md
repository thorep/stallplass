# Stallplass API Reference

## Overview

This document provides a comprehensive reference for all API endpoints in the Stallplass application. Each endpoint includes request/response types, authentication requirements, and which service functions are used.

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Stables API

#### GET /api/stables
**Description**: Get stables based on filters
**Authentication**: Optional (returns different data based on auth)
**Query Parameters**:
- `owner_id` (string): Filter by owner ID
- `include_boxes` (boolean): Include box data
**Service Functions**: 
- `getStablesByOwner()` - when owner_id provided
- `getAllStables()` - for admin users
- `getPublicStables()` - for public access
**Response**: `StableWithAmenities[]` or `StableWithBoxStats[]`
**Used by Hook**: `useGetStables()`, `useGetStablesByOwner()`

#### POST /api/stables
**Description**: Create a new stable
**Authentication**: Required
**Body**: `CreateStableData`
**Service Functions**: `createStable()`
**Response**: `StableWithAmenities`
**Used by Hook**: `usePostStable()`

#### GET /api/stables/[id]
**Description**: Get stable by ID
**Authentication**: Optional
**Service Functions**: `getStableById()`
**Response**: `StableWithAmenities | null`
**Used by Hook**: `useGetStableById()`

#### PUT /api/stables/[id]
**Description**: Update a stable
**Authentication**: Required (must be owner)
**Body**: `UpdateStableData`
**Service Functions**: `updateStable()`
**Response**: `StableWithAmenities`
**Used by Hook**: `usePutStable()`

#### DELETE /api/stables/[id]
**Description**: Delete a stable
**Authentication**: Required (must be owner)
**Service Functions**: `deleteStable()`
**Response**: `{ success: boolean }`
**Used by Hook**: `useDeleteStable()`

#### POST /api/stables/[id]/faqs
**Description**: Create FAQ for stable
**Authentication**: Required (must be owner)
**Body**: `{ question: string, answer: string }`
**Service Functions**: Direct Prisma call
**Response**: `stable_faqs`
**Used by Hook**: `usePostStableFAQ()`

#### PUT /api/stables/[id]/faqs/[faqId]
**Description**: Update FAQ
**Authentication**: Required (must be owner)
**Body**: `{ question?: string, answer?: string }`
**Service Functions**: Direct Prisma call
**Response**: `stable_faqs`
**Used by Hook**: `usePutStableFAQ()`

#### DELETE /api/stables/[id]/faqs/[faqId]
**Description**: Delete FAQ
**Authentication**: Required (must be owner)
**Service Functions**: Direct Prisma call
**Response**: `{ success: boolean }`
**Used by Hook**: `useDeleteStableFAQ()`

### Boxes API

#### GET /api/boxes
**Description**: Search boxes with filters
**Authentication**: Optional
**Query Parameters**:
- `stableId` (string): Filter by stable
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `county` (string): Filter by county
- `municipality` (string): Filter by municipality
- `amenities` (string[]): Required amenities
- `isSponsored` (boolean): Only sponsored boxes
**Service Functions**: `searchBoxes()`
**Response**: `BoxWithStablePreview[]`
**Used by Hook**: `useGetBoxes()`

#### POST /api/boxes
**Description**: Create a new box
**Authentication**: Required
**Body**: `CreateBoxData`
**Service Functions**: `createBox()`
**Response**: `Box`
**Used by Hook**: `usePostBox()`

#### GET /api/boxes/[id]
**Description**: Get box by ID
**Authentication**: Optional
**Service Functions**: `getBoxWithStable()`
**Response**: `BoxWithStablePreview | null`
**Used by Hook**: `useGetBoxById()`

#### PUT /api/boxes/[id]
**Description**: Update a box
**Authentication**: Required (must be stable owner)
**Body**: `UpdateBoxData`
**Service Functions**: `updateBox()`
**Response**: `Box`
**Used by Hook**: `usePutBox()`

#### DELETE /api/boxes/[id]
**Description**: Delete a box
**Authentication**: Required (must be stable owner)
**Service Functions**: `deleteBox()`
**Response**: `{ success: boolean }`
**Used by Hook**: `useDeleteBox()`

#### POST /api/boxes/[id]/advertising
**Description**: Purchase box advertising
**Authentication**: Required (must be stable owner)
**Body**: `{ months: number }`
**Service Functions**: `purchaseBoxAdvertising()`
**Response**: `Box`
**Used by Hook**: `usePostBoxAdvertising()`

#### GET /api/boxes/[id]/advertising
**Description**: Get box advertising info
**Authentication**: Required
**Service Functions**: `getBoxAdvertisingInfo()`
**Response**: `{ isActive: boolean, endDate: Date | null, daysRemaining: number }`
**Used by Hook**: `useGetBoxAdvertisingInfo()`

#### GET /api/stables/[id]/boxes
**Description**: Get all boxes for a stable
**Authentication**: Optional
**Service Functions**: `getBoxesByStableId()`
**Response**: `Box[]`
**Used by Hook**: `useGetStableBoxes()`

### Invoice Requests API

#### GET /api/invoice-requests
**Description**: Get user's invoice requests
**Authentication**: Required
**Service Functions**: `getUserInvoiceRequests()`
**Response**: `invoice_requests[]`
**Used by Hook**: `useGetInvoiceRequests()`

#### POST /api/invoice-requests/create
**Description**: Create invoice request and activate feature
**Authentication**: Required
**Body**: `CreateInvoiceRequestData`
**Service Functions**: `createInvoiceRequest()`
**Response**: `invoice_requests`
**Used by Hook**: `usePostInvoiceRequest()`

### Admin APIs

#### GET /api/admin/users
**Description**: Get all users with statistics
**Authentication**: Required (admin only)
**Service Functions**: `getAdminUsersWithCounts()`
**Response**: Admin user data with counts
**Used by Hook**: `useGetAdminUsers()`

#### GET /api/admin/stables
**Description**: Get all stables with statistics
**Authentication**: Required (admin only)
**Service Functions**: `getAdminStablesWithCounts()`
**Response**: Admin stable data with counts
**Used by Hook**: `useGetAdminStables()`

#### GET /api/admin/boxes
**Description**: Get all boxes with statistics
**Authentication**: Required (admin only)
**Service Functions**: `getAdminBoxesWithCounts()`
**Response**: Admin box data with counts
**Used by Hook**: `useGetAdminBoxes()`

#### GET /api/admin/payments
**Description**: Get all payments
**Authentication**: Required (admin only)
**Service Functions**: `getAdminPaymentsWithDetails()`
**Response**: Payment data with details
**Used by Hook**: `useGetAdminPayments()`

#### POST /api/admin/cleanup
**Description**: Run system cleanup
**Authentication**: Required (admin only)
**Service Functions**: `performSystemCleanup()`
**Response**: Cleanup results
**Used by Hook**: `usePostAdminCleanup()`

#### PUT /api/admin/invoice-requests/[id]
**Description**: Update invoice request status
**Authentication**: Required (admin only)
**Body**: `{ status: string, paidAt?: Date }`
**Service Functions**: `updateInvoiceRequestStatus()`
**Response**: `invoice_requests`
**Used by Hook**: `usePutInvoiceRequest()`

### Services (Tjenester) API

#### GET /api/services
**Description**: Get services with filters
**Authentication**: Optional
**Query Parameters**:
- `user_id` (string): Filter by user
- `county` (string): Filter by county
- `municipality` (string): Filter by municipality
- `service_type` (string): Service type filter
**Service Functions**: 
- `getServicesByUser()` - when user_id provided
- `searchServices()` - with filters
- `getAllServices()` - no filters
**Response**: `ServiceWithDetails[]`
**Used by Hook**: `useGetServices()`, `useGetServicesByUser()`

#### POST /api/services
**Description**: Create a service listing
**Authentication**: Required
**Body**: `CreateServiceData`
**Service Functions**: `createService()`
**Response**: `Service`
**Used by Hook**: `usePostService()`

#### GET /api/services/[id]
**Description**: Get service by ID
**Authentication**: Optional
**Service Functions**: `getServiceById()`
**Response**: `ServiceWithDetails | null`
**Used by Hook**: `useGetServiceById()`

#### PUT /api/services/[id]
**Description**: Update a service
**Authentication**: Required (must be owner)
**Body**: `UpdateServiceData`
**Service Functions**: `updateService()`
**Response**: `Service`
**Used by Hook**: `usePutService()`

#### DELETE /api/services/[id]
**Description**: Delete a service
**Authentication**: Required (must be owner)
**Service Functions**: `deleteService()`
**Response**: `{ success: boolean }`
**Used by Hook**: `useDeleteService()`

### Conversations API

#### GET /api/conversations
**Description**: Get user's conversations
**Authentication**: Required
**Service Functions**: `getUserConversations()`, `getStableOwnerConversations()`
**Response**: `ConversationWithDetails[]`
**Used by Hook**: `useGetConversations()`

#### POST /api/conversations
**Description**: Create or get existing conversation
**Authentication**: Required
**Body**: `{ stableId: string }`
**Service Functions**: Direct Prisma calls
**Response**: `conversations`
**Used by Hook**: `usePostConversation()`

#### GET /api/conversations/[id]/messages
**Description**: Get conversation messages
**Authentication**: Required (must be participant)
**Service Functions**: `getConversationMessages()`
**Response**: `MessageWithSender[]`
**Used by Hook**: `useGetMessages()`

#### POST /api/conversations/[id]/messages
**Description**: Send a message
**Authentication**: Required (must be participant)
**Body**: `{ content: string }`
**Service Functions**: `sendMessage()`
**Response**: `messages`
**Used by Hook**: `usePostMessage()`

### Amenities API

#### GET /api/stable-amenities
**Description**: Get all stable amenities
**Authentication**: None
**Service Functions**: `getAllStableAmenities()`
**Response**: `stable_amenities[]`
**Used by Hook**: `useGetStableAmenities()`

#### GET /api/box-amenities
**Description**: Get all box amenities
**Authentication**: None
**Service Functions**: `getAllBoxAmenities()`
**Response**: `box_amenities[]`
**Used by Hook**: `useGetBoxAmenities()`

#### POST /api/admin/amenities/stable
**Description**: Create stable amenity
**Authentication**: Required (admin only)
**Body**: `{ name: string }`
**Service Functions**: `createStableAmenity()`
**Response**: `stable_amenities`
**Used by Hook**: `usePostStableAmenity()`

#### PUT /api/admin/amenities/stable
**Description**: Update stable amenity
**Authentication**: Required (admin only)
**Body**: `{ id: string, name: string }`
**Service Functions**: `updateStableAmenity()`
**Response**: `stable_amenities`
**Used by Hook**: `usePutStableAmenity()`

#### DELETE /api/admin/amenities/stable
**Description**: Delete stable amenity
**Authentication**: Required (admin only)
**Body**: `{ id: string }`
**Service Functions**: `deleteStableAmenity()`
**Response**: `{ success: boolean }`
**Used by Hook**: `useDeleteStableAmenity()`

### Pricing API

#### GET /api/pricing/base
**Description**: Get base pricing
**Authentication**: None
**Service Functions**: `getServiceBasePriceObject()`, `getSponsoredPlacementPriceObject()`, `getBoxAdvertisingPriceObject()`
**Response**: Base pricing data
**Used by Hook**: `useGetBasePricing()`

#### GET /api/pricing/discounts
**Description**: Get pricing discounts
**Authentication**: None
**Service Functions**: `getAllDiscounts()`, `getAllBoxQuantityDiscounts()`, `getAllBoostDiscounts()`
**Response**: Discount data
**Used by Hook**: `useGetPricingDiscounts()`

#### GET /api/pricing/service
**Description**: Get service pricing
**Authentication**: None
**Service Functions**: `getServicePricingDiscounts()`
**Response**: Service pricing data
**Used by Hook**: `useGetServicePricing()`

### Analytics API

#### GET /api/analytics/views
**Description**: Get view analytics
**Authentication**: Required
**Query Parameters**:
- `entityType` (string): 'stable' or 'box'
- `entityId` (string): Entity ID
- `startDate` (string): ISO date
- `endDate` (string): ISO date
**Service Functions**: `getViewAnalytics()`
**Response**: View analytics data
**Used by Hook**: `useGetViewAnalytics()`

#### POST /api/page-views
**Description**: Track a page view
**Authentication**: Optional
**Body**: `{ entityType: string, entityId: string }`
**Service Functions**: `trackView()`
**Response**: `{ success: boolean }`
**Used by Hook**: `usePostPageView()`

### Location API

#### GET /api/locations/fylker
**Description**: Get all counties
**Authentication**: None
**Service Functions**: `getFylker()`
**Response**: County data
**Used by Hook**: `useGetFylker()`

#### GET /api/locations/kommuner
**Description**: Get municipalities
**Authentication**: None
**Query Parameters**:
- `fylke` (string): County name
**Service Functions**: `getKommuner()`
**Response**: Municipality data
**Used by Hook**: `useGetKommuner()`

#### GET /api/locations/tettsteder
**Description**: Get populated areas
**Authentication**: None
**Query Parameters**:
- `kommune` (string): Municipality name
**Service Functions**: `getTettsteder()`
**Response**: Populated area data
**Used by Hook**: `useGetTettsteder()`

#### GET /api/locations/search
**Description**: Search locations
**Authentication**: None
**Query Parameters**:
- `query` (string): Search query
**Service Functions**: `searchLocations()`
**Response**: Location search results
**Used by Hook**: `useGetLocationSearch()`

### User API

#### GET /api/user
**Description**: Get current user
**Authentication**: Required
**Service Functions**: `getUserById()`
**Response**: `users | null`
**Used by Hook**: `useGetCurrentUser()`

#### POST /api/users
**Description**: Create or ensure user exists
**Authentication**: Required
**Body**: User data from auth
**Service Functions**: `ensureUserExists()`
**Response**: `users`
**Used by Hook**: `usePostUser()`

#### GET /api/users/[id]
**Description**: Get user by ID
**Authentication**: Required
**Parameters**: `id` (string)
**Service Functions**: `getUserById()`
**Response**: `users | null`
**Used by Hook**: `useGetUserById()`

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400/401/403/404/500
}
```

Common status codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented, but the following limits are recommended:
- Authentication endpoints: 5 requests per minute
- Data fetching: 30 requests per minute
- Data mutations: 10 requests per minute

## Webhooks

The application uses Supabase webhooks for:
- User registration (creates user record)
- Real-time updates (conversations, messages)