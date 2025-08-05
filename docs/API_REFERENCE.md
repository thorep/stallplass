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
**Description**: Search boxes with filters (legacy endpoint - prefer /api/search with mode=boxes)
**Authentication**: Optional
**Query Parameters**:
- `stableId` (string): Filter by stable
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `fylkeId` (string): Filter by county ID
- `kommuneId` (string): Filter by municipality ID
- `amenityIds` (string): Comma-separated amenity IDs
- `occupancyStatus` (string): `all`, `available`, or `occupied`
- `max_horse_size` (string): Maximum horse size
**Service Functions**: `searchBoxes()`
**Response**: `BoxWithStablePreview[]`
**Used by Hook**: `useBoxes()` (for basic listing)

### Unified Search API

#### GET /api/search
**Description**: Unified search endpoint for both stables and boxes
**Authentication**: Optional
**Query Parameters**:
- `mode` (string): Search mode - `stables` or `boxes` (required)
- `fylkeId` (string): Filter by county ID
- `kommuneId` (string): Filter by municipality ID  
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `amenityIds` (string): Comma-separated amenity IDs
- `query` (string): Text search in name/description

**Box-specific filters** (ignored when mode='stables'):
- `occupancyStatus` (string): `all`, `available`, or `occupied`
- `boxSize` (string): Size requirements
- `boxType` (string): `boks` or `utegang`
- `horseSize` (string): Maximum horse size

**Stable-specific filters** (ignored when mode='boxes'):
- `availableSpaces` (string): `any` or `available`

**Service Functions**: `searchBoxes()` or `searchStables()` based on mode
**Response**: `BoxWithStablePreview[]` for boxes, `StableWithBoxStats[]` for stables
**Used by Hook**: `useUnifiedSearch()`, `useStableSearch()`, `useBoxSearch()`

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

## TanStack Query Hooks

### Unified Search Hooks

#### useUnifiedSearch(filters: UnifiedSearchFilters)
**Description**: Unified search hook for both stables and boxes  
**Endpoint**: `/api/search`  
**Parameters**: 
- `filters.mode`: `'stables'` or `'boxes'` (required)
- Other filters as documented in the API endpoint
**Returns**: Query result with `data`, `isLoading`, `error`  
**Cache Key**: `['unified-search', filters]`  

#### useStableSearch(filters: Omit<UnifiedSearchFilters, 'mode'>)
**Description**: Type-safe wrapper for stable search  
**Endpoint**: `/api/search?mode=stables`  
**Returns**: Query result with `StableWithBoxStats[]` data  

#### useBoxSearch(filters: Omit<UnifiedSearchFilters, 'mode'>)
**Description**: Type-safe wrapper for box search  
**Endpoint**: `/api/search?mode=boxes`  
**Returns**: Query result with `BoxWithStablePreview[]` data  

### Filter Types

#### UnifiedSearchFilters
```typescript
interface UnifiedSearchFilters {
  // Common filters
  fylkeId?: string;
  kommuneId?: string;
  mode: 'stables' | 'boxes';
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  query?: string;
  
  // Box-specific filters (ignored when mode='stables')
  occupancyStatus?: 'all' | 'available' | 'occupied';
  boxSize?: string;
  boxType?: 'boks' | 'utegang' | 'any';
  horseSize?: string;
  
  // Stable-specific filters (ignored when mode='boxes')
  availableSpaces?: 'any' | 'available';
}
```

### Migration Notes

#### Deprecated Hooks
- ~~`useStableSearch()`~~ from `useStables.ts` - replaced by `useStableSearch()` from `useUnifiedSearch.ts`
- ~~`useStablesWithBoxStats()`~~ - functionality moved to unified search
- ~~`useBoxSearch()`~~ from `useBoxes.ts` - replaced by `useBoxSearch()` from `useUnifiedSearch.ts`

#### Breaking Changes  
- **BoxType Filter**: Changed from `'indoor'/'outdoor'` to `'boks'/'utegang'` to match database enum
- **Unified Endpoint**: `/api/stables/search` removed, use `/api/search?mode=stables`
- **Filter Structure**: Price filters now mode-specific (stableMinPrice vs boxMinPrice in UI)

---

## Analytics & Page Views API

### POST /api/page-views
/**
 * @swagger
 * /api/page-views:
 *   post:
 *     summary: Track page view for stallplass entities
 *     description: |
 *       Tracks page views for stalls, boxes, and services. Owner views are automatically filtered out
 *       to prevent inflated statistics. Uses server-side counter increments for performance.
 *     tags:
 *       - Analytics
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [STABLE, BOX, SERVICE]
 *                 description: Type of entity being viewed
 *                 example: "STABLE"
 *               entityId:
 *                 type: string
 *                 description: ID of the entity being viewed
 *                 example: "stable-123"
 *               viewerId:
 *                 type: string
 *                 description: ID of viewer (can be anonymous with 'anon-' prefix)
 *                 example: "user-456"
 *     responses:
 *       200:
 *         description: Page view tracked successfully or skipped for owner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entityType:
 *                   type: string
 *                   example: "STABLE"
 *                 entityId:
 *                   type: string
 *                   example: "stable-123"
 *                 viewCount:
 *                   type: number
 *                   description: Updated view count
 *                   example: 42
 *                 skipped:
 *                   type: boolean
 *                   description: Whether view was skipped (owner viewing own content)
 *                   example: false
 *                 reason:
 *                   type: string
 *                   description: Reason for skipping (if applicable)
 *                   example: "Owner views are not tracked"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error while tracking view
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Track page views for stables, boxes, and services  
**Authentication**: None  
**Body**: 
```typescript
{
  entityType: 'STABLE' | 'BOX' | 'SERVICE';
  entityId: string;
  viewerId?: string; // Optional viewer ID
}
```
**Service Functions**: Direct Prisma increment operations  
**Response**: `{ entityType, entityId, viewCount, skipped?, reason? }`  
**Used by**: View tracking components across the application  

### GET /api/analytics/views
/**
 * @swagger
 * /api/analytics/views:
 *   get:
 *     summary: Get view analytics for owner's entities
 *     description: |
 *       Retrieves comprehensive view analytics for all entities owned by a user (stables, boxes, services).
 *       Can get aggregate data for all entities or specific data for one entity.
 *     tags:
 *       - Analytics
 *     security: []
 *     parameters:
 *       - name: ownerId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the owner to get analytics for
 *         example: "user-123"
 *       - name: entityType
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [STABLE, BOX, SERVICE]
 *         description: Filter by entity type (used with entityId)
 *         example: "STABLE"
 *       - name: entityId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Get analytics for specific entity (requires entityType)
 *         example: "stable-123"
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Aggregate analytics for all owner's entities
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalStableViews:
 *                           type: number
 *                           example: 150
 *                         totalBoxViews:
 *                           type: number
 *                           example: 320
 *                         totalServiceViews:
 *                           type: number
 *                           example: 85
 *                         totalViews:
 *                           type: number
 *                           example: 555
 *                     stables:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stableId:
 *                             type: string
 *                           stableName:
 *                             type: string
 *                           views:
 *                             type: number
 *                     boxes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           boxId:
 *                             type: string
 *                           boxName:
 *                             type: string
 *                           stableName:
 *                             type: string
 *                           views:
 *                             type: number
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           serviceId:
 *                             type: string
 *                           serviceName:
 *                             type: string
 *                           serviceType:
 *                             type: string
 *                           views:
 *                             type: number
 *                 - type: object
 *                   description: Analytics for specific entity
 *                   properties:
 *                     entityId:
 *                       type: string
 *                       example: "stable-123"
 *                     entityType:
 *                       type: string
 *                       example: "STABLE"
 *                     totalViews:
 *                       type: number
 *                       example: 150
 *                     viewsByDay:
 *                       type: array
 *                       description: Currently empty (using counters instead of daily breakdown)
 *                       items: {}
 *       400:
 *         description: Missing required ownerId parameter
 *       500:
 *         description: Server error retrieving analytics
 */
**Description**: Get view analytics for owner's entities  
**Authentication**: None (but requires ownerId parameter)  
**Query Parameters**:
- `ownerId` (string, required): Owner ID to get analytics for
- `entityType` (string, optional): Filter by entity type
- `entityId` (string, optional): Get analytics for specific entity
**Service Functions**: Direct Prisma queries with aggregations  
**Response**: Analytics object with summary and detailed breakdowns  
**Used by**: Analytics dashboard components  

---

## Pricing API

### GET /api/pricing/base
/**
 * @swagger
 * /api/pricing/base:
 *   get:
 *     summary: Get base advertising price for boxes
 *     description: |
 *       Returns the current base monthly price for box advertising. This is the foundation
 *       price used in pricing calculations before applying discounts.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: Base pricing information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Price record ID
 *                 itemType:
 *                   type: string
 *                   enum: [BOX_ADVERTISING]
 *                   description: Type of pricing
 *                 price:
 *                   type: number
 *                   description: Base monthly price in NOK
 *                   example: 299
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to fetch base pricing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get base advertising price for boxes  
**Authentication**: None  
**Service Functions**: `getBoxAdvertisingPriceObject()`  
**Response**: `{ id, itemType, price, createdAt, updatedAt }`  
**Used by**: Pricing calculations and display components  

### GET /api/pricing/discounts
/**
 * @swagger
 * /api/pricing/discounts:
 *   get:
 *     summary: Get all pricing discounts for box advertising
 *     description: |
 *       Returns available discounts for box advertising, including volume discounts
 *       for multiple boxes and duration discounts for longer commitments.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: Discount information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthDiscounts:
 *                   type: array
 *                   description: Discounts based on subscription duration
 *                   items:
 *                     type: object
 *                     properties:
 *                       months:
 *                         type: number
 *                         description: Minimum months for discount
 *                         example: 6
 *                       percentage:
 *                         type: number
 *                         description: Discount percentage (0-100)
 *                         example: 15
 *                 boxQuantityDiscounts:
 *                   type: array
 *                   description: Discounts based on number of boxes
 *                   items:
 *                     type: object
 *                     properties:
 *                       minBoxes:
 *                         type: number
 *                         description: Minimum boxes for discount
 *                         example: 5
 *                       percentage:
 *                         type: number
 *                         description: Discount percentage (0-100)
 *                         example: 10
 *       500:
 *         description: Failed to fetch discounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get all pricing discounts for box advertising  
**Authentication**: None  
**Service Functions**: `getAllDiscounts()`  
**Response**: `{ monthDiscounts[], boxQuantityDiscounts[] }`  
**Used by**: Pricing calculator components  

### GET /api/pricing/calculate
/**
 * @swagger
 * /api/pricing/calculate:
 *   get:
 *     summary: Calculate pricing with discounts for box advertising
 *     description: |
 *       Calculates the final pricing for box advertising including all applicable discounts.
 *       Used by the public advertising modal to show accurate pricing to users.
 *     tags:
 *       - Pricing
 *     security: []
 *     parameters:
 *       - name: boxes
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of boxes to advertise
 *         example: 3
 *       - name: months
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of months for advertising
 *         example: 6
 *     responses:
 *       200:
 *         description: Pricing calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 baseMonthlyPrice:
 *                   type: number
 *                   description: Base price per box per month
 *                   example: 299
 *                 totalMonthlyPrice:
 *                   type: number
 *                   description: Total monthly price before discounts
 *                   example: 897
 *                 monthDiscount:
 *                   type: number
 *                   description: Discount amount for duration
 *                   example: 134.55
 *                 monthDiscountPercentage:
 *                   type: number
 *                   description: Duration discount percentage
 *                   example: 15
 *                 boxQuantityDiscount:
 *                   type: number
 *                   description: Discount amount for quantity
 *                   example: 0
 *                 boxQuantityDiscountPercentage:
 *                   type: number
 *                   description: Quantity discount percentage
 *                   example: 0
 *                 totalPrice:
 *                   type: number
 *                   description: Total price before discounts
 *                   example: 5382
 *                 finalPrice:
 *                   type: number
 *                   description: Final price after all discounts
 *                   example: 4574.7
 *       400:
 *         description: Invalid parameters (boxes or months must be positive)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to calculate pricing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Calculate pricing with discounts for box advertising  
**Authentication**: None  
**Query Parameters**:
- `boxes` (number, required): Number of boxes to advertise
- `months` (number, required): Duration in months
**Service Functions**: `calculatePricingWithDiscounts()`  
**Response**: Complete pricing breakdown with discounts  
**Used by**: Advertising modal pricing display  

### GET /api/pricing/boost-daily-price
/**
 * @swagger
 * /api/pricing/boost-daily-price:
 *   get:
 *     summary: Get daily price for sponsored placement boost
 *     description: |
 *       Returns the current daily price for boosting boxes to sponsored placement.
 *       Sponsored placement gives boxes priority visibility in search results.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: Daily boost price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyPrice:
 *                   type: number
 *                   description: Daily price for sponsored placement in NOK
 *                   example: 25
 *       500:
 *         description: Failed to fetch boost daily price
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get daily price for sponsored placement boost  
**Authentication**: None  
**Service Functions**: `getSponsoredPlacementPrice()`  
**Response**: `{ dailyPrice: number }`  
**Used by**: Boost/sponsored placement components  

### GET /api/pricing/boost-discounts
/**
 * @swagger
 * /api/pricing/boost-discounts:
 *   get:
 *     summary: Get discounts for sponsored placement boost
 *     description: |
 *       Returns available discounts for sponsored placement boosts based on duration.
 *       Longer boost periods receive better discount rates.
 *     tags:
 *       - Pricing
 *     security: []
 *     responses:
 *       200:
 *         description: Boost discounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   minDays:
 *                     type: number
 *                     description: Minimum days for discount
 *                     example: 7
 *                   percentage:
 *                     type: number
 *                     description: Discount percentage (0-100)
 *                     example: 10
 *                   description:
 *                     type: string
 *                     description: Human-readable discount description
 *                     example: "10% off for 7+ days"
 *       500:
 *         description: Failed to fetch boost discounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get discounts for sponsored placement boost  
**Authentication**: None  
**Service Functions**: `getAllBoostDiscounts()`  
**Response**: Array of boost discount objects  
**Used by**: Boost pricing display components  

### GET /api/pricing/service
/**
 * @swagger
 * /api/pricing/service:
 *   get:
 *     summary: Get service advertising pricing information
 *     description: |
 *       Returns service advertising pricing. Can return base pricing and discount tiers,
 *       or calculate specific pricing for a given number of months.
 *     tags:
 *       - Pricing
 *     security: []
 *     parameters:
 *       - name: months
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Calculate pricing for specific number of months
 *         example: 6
 *     responses:
 *       200:
 *         description: Service pricing information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Base pricing and discount tiers (when months not specified)
 *                   properties:
 *                     basePrice:
 *                       type: number
 *                       description: Base monthly price for service advertising
 *                       example: 199
 *                     tiers:
 *                       type: array
 *                       description: Available discount tiers
 *                       items:
 *                         type: object
 *                         properties:
 *                           months:
 *                             type: number
 *                             example: 6
 *                           percentage:
 *                             type: number
 *                             example: 15
 *                     discounts:
 *                       type: array
 *                       description: Simplified discount information
 *                       items:
 *                         type: object
 *                         properties:
 *                           months:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                 - type: object
 *                   description: Calculated pricing for specific months
 *                   properties:
 *                     calculation:
 *                       type: object
 *                       properties:
 *                         months:
 *                           type: number
 *                           example: 6
 *                         baseMonthlyPrice:
 *                           type: number
 *                           example: 199
 *                         totalBeforeDiscount:
 *                           type: number
 *                           example: 1194
 *                         discount:
 *                           type: object
 *                           properties:
 *                             percentage:
 *                               type: number
 *                               example: 15
 *                             amount:
 *                               type: number
 *                               example: 179.1
 *                         finalTotal:
 *                           type: number
 *                           example: 1014.9
 *       400:
 *         description: Invalid months parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch service pricing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get service advertising pricing information  
**Authentication**: None  
**Query Parameters**:
- `months` (number, optional): Calculate pricing for specific duration
**Service Functions**: `getServiceBasePriceObject()`, `getServiceDiscountTiers()`, `calculateServicePricing()`  
**Response**: Base pricing and tiers OR calculated pricing  
**Used by**: Service advertising pricing components  

---

## Amenities API

### GET /api/box-amenities
/**
 * @swagger
 * /api/box-amenities:
 *   get:
 *     summary: Get all available box amenities
 *     description: |
 *       Returns a list of all box amenities that can be associated with stall boxes.
 *       Used for filtering search results and configuring box features.
 *     tags:
 *       - Amenities
 *     security: []
 *     responses:
 *       200:
 *         description: Box amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique amenity ID
 *                     example: "box-amenity-123"
 *                   name:
 *                     type: string
 *                     description: Amenity name in Norwegian
 *                     example: "Automatisk vannkopp"
 *                   description:
 *                     type: string
 *                     description: Detailed description
 *                     example: "Automatisk fyllende vannkopp for kontinuerlig tilgang til friskt vann"
 *                   category:
 *                     type: string
 *                     description: Amenity category
 *                     example: "VANN_OG_FOR"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether amenity is currently active
 *                     example: true
 *                   sortOrder:
 *                     type: number
 *                     description: Display order
 *                     example: 10
 *       500:
 *         description: Failed to fetch box amenities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get all available box amenities  
**Authentication**: None  
**Service Functions**: `getAllBoxAmenities()`  
**Response**: Array of box amenity objects  
**Used by**: Box configuration and search filter components  

### GET /api/stable-amenities
/**
 * @swagger
 * /api/stable-amenities:
 *   get:
 *     summary: Get all available stable amenities
 *     description: |
 *       Returns a list of all stable amenities that can be associated with horse stables.
 *       Used for filtering search results and configuring stable features.
 *     tags:
 *       - Amenities
 *     security: []
 *     responses:
 *       200:
 *         description: Stable amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique amenity ID
 *                     example: "stable-amenity-123"
 *                   name:
 *                     type: string
 *                     description: Amenity name in Norwegian
 *                     example: "Ridesenter med instruktører"
 *                   description:
 *                     type: string
 *                     description: Detailed description
 *                     example: "Fullt utstyrt ridesenter med kvalifiserte instruktører"
 *                   category:
 *                     type: string
 *                     description: Amenity category
 *                     example: "UNDERVISNING"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether amenity is currently active
 *                     example: true
 *                   sortOrder:
 *                     type: number
 *                     description: Display order
 *                     example: 5
 *       500:
 *         description: Failed to fetch stable amenities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get all available stable amenities  
**Authentication**: None  
**Service Functions**: `getAllStableAmenities()`  
**Response**: Array of stable amenity objects  
**Used by**: Stable configuration and search filter components  

---

## Special Box Operations API

### PATCH /api/boxes/[id]/availability
/**
 * @swagger
 * /api/boxes/{id}/availability:
 *   patch:
 *     summary: Update box availability status
 *     description: |
 *       Updates the availability status of a specific box. Only the box owner
 *       can modify availability. This affects search visibility and booking status.
 *     tags:
 *       - Boxes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID
 *         example: "box-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: New availability status
 *                 example: true
 *     responses:
 *       200:
 *         description: Box availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 box:
 *                   $ref: '#/components/schemas/Box'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: You can only update your own boxes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update box availability
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Update box availability status  
**Authentication**: Required (must be box owner)  
**Body**: `{ isAvailable: boolean }`  
**Service Functions**: `updateBoxAvailability()`  
**Response**: `{ box: UpdatedBox }`  
**Used by**: Box management components  

### GET /api/boxes/[id]/advertising
/**
 * @swagger
 * /api/boxes/{id}/advertising:
 *   get:
 *     summary: Get advertising status for a specific box
 *     description: |
 *       Returns the current advertising status and details for a box, including
 *       subscription information, expiration dates, and active status.
 *     tags:
 *       - Boxes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID
 *         example: "box-123"
 *     responses:
 *       200:
 *         description: Box advertising information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxId:
 *                   type: string
 *                   example: "box-123"
 *                 hasActiveAdvertising:
 *                   type: boolean
 *                   description: Whether box has active advertising
 *                   example: true
 *                 advertisingExpiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: When advertising expires
 *                   example: "2024-06-15T10:30:00Z"
 *                 daysRemaining:
 *                   type: number
 *                   description: Days remaining in advertising period
 *                   example: 45
 *                 sponsoredUntil:
 *                   type: string
 *                   format: date-time
 *                   description: When sponsored placement expires (if applicable)
 *                   example: "2024-03-20T10:30:00Z"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to get box advertising info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get advertising status for a specific box  
**Authentication**: Required  
**Service Functions**: `getBoxAdvertisingInfo()`  
**Response**: Advertising information object  
**Used by**: Advertising management components  

### GET /api/boxes/[id]/sponsored
/**
 * @swagger
 * /api/boxes/{id}/sponsored:
 *   get:
 *     summary: Get sponsored placement information for a box
 *     description: |
 *       Returns the current sponsored placement status and details for a box,
 *       including boost expiration and remaining days.
 *     tags:
 *       - Boxes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID
 *         example: "box-123"
 *     responses:
 *       200:
 *         description: Sponsored placement information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 boxId:
 *                   type: string
 *                   example: "box-123"
 *                 isSponsored:
 *                   type: boolean
 *                   description: Whether box is currently sponsored
 *                   example: true
 *                 sponsoredUntil:
 *                   type: string
 *                   format: date-time
 *                   description: When sponsored placement expires
 *                   example: "2024-03-20T10:30:00Z"
 *                 daysRemaining:
 *                   type: number
 *                   description: Days remaining in sponsored period
 *                   example: 5
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Bad request or box error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get sponsored placement information for a box  
**Authentication**: Required  
**Service Functions**: `getSponsoredPlacementInfo()`  
**Response**: Sponsored placement information object  
**Used by**: Sponsored placement management components  

### POST /api/boxes/[id]/sponsored
/**
 * @swagger
 * /api/boxes/{id}/sponsored:
 *   post:
 *     summary: Purchase sponsored placement boost for a box
 *     description: |
 *       Purchases sponsored placement for a box, giving it priority visibility
 *       in search results. Creates an invoice request for the boost cost.
 *     tags:
 *       - Boxes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID
 *         example: "box-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - days
 *             properties:
 *               days:
 *                 type: number
 *                 minimum: 1
 *                 description: Number of days for sponsored placement
 *                 example: 7
 *     responses:
 *       200:
 *         description: Sponsored placement purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 box:
 *                   $ref: '#/components/schemas/Box'
 *                 cost:
 *                   type: object
 *                   properties:
 *                     dailyPrice:
 *                       type: number
 *                       example: 25
 *                     days:
 *                       type: number
 *                       example: 7
 *                     subtotal:
 *                       type: number
 *                       example: 175
 *                     discount:
 *                       type: number
 *                       example: 17.5
 *                     totalCost:
 *                       type: number
 *                       example: 157.5
 *       400:
 *         description: Invalid number of days or other error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Purchase sponsored placement boost for a box  
**Authentication**: Required  
**Body**: `{ days: number }`  
**Service Functions**: `purchaseSponsoredPlacement()`, `calculateSponsoredPlacementCost()`  
**Response**: `{ box: UpdatedBox, cost: CostInfo }`  
**Used by**: Sponsored placement purchase components  

### POST /api/boxes/[id]/restore
/**
 * @swagger
 * /api/boxes/{id}/restore:
 *   post:
 *     summary: Restore a deleted/archived box
 *     description: |
 *       Restores a previously deleted or archived box, making it active again.
 *       Only the stable owner can restore boxes from their stables.
 *     tags:
 *       - Boxes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Box ID to restore
 *         example: "box-123"
 *     responses:
 *       200:
 *         description: Box restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Box restored successfully"
 *       403:
 *         description: You can only restore boxes in your own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Box not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to restore box
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Restore a deleted/archived box  
**Authentication**: Required (must be stable owner)  
**Service Functions**: `restoreBox()`  
**Response**: `{ message: string }`  
**Used by**: Box management and restoration components  

### GET /api/boxes/by-ids
/**
 * @swagger
 * /api/boxes/by-ids:
 *   get:
 *     summary: Fetch multiple boxes by their IDs
 *     description: |
 *       Retrieves multiple boxes in a single request using their IDs.
 *       Used primarily by bulk advertising functionality to display
 *       selected boxes for batch operations.
 *     tags:
 *       - Boxes
 *     security: []
 *     parameters:
 *       - name: ids
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of box IDs
 *         example: "box-123,box-456,box-789"
 *     responses:
 *       200:
 *         description: Boxes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Box'
 *       400:
 *         description: Box IDs are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch boxes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Fetch multiple boxes by their IDs  
**Authentication**: None  
**Query Parameters**:
- `ids` (string, required): Comma-separated box IDs
**Service Functions**: `getBoxesByIds()`  
**Response**: Array of box objects  
**Used by**: Bulk advertising page components  

---

## Invoice Requests API

### GET /api/invoice-requests
/**
 * @swagger
 * /api/invoice-requests:
 *   get:
 *     summary: Get invoice requests
 *     description: |
 *       Returns invoice requests based on access level. Regular users get their own
 *       invoice requests, while admins can access all invoice requests with filtering
 *       and pagination options.
 *     tags:
 *       - Invoice Requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: admin
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Request admin view (requires admin privileges)
 *         example: true
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, INVOICE_SENT, PAID, CANCELLED]
 *         description: Filter by status (admin only)
 *         example: "PENDING"
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [createdAt, amount, fullName, status]
 *         description: Sort field (admin only, default createdAt)
 *         example: "createdAt"
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (admin only, default desc)
 *         example: "desc"
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (admin only, default 1)
 *         example: 1
 *       - name: pageSize
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page (admin only, default 20)
 *         example: 20
 *     responses:
 *       200:
 *         description: Invoice requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Regular user response
 *                   properties:
 *                     invoiceRequests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InvoiceRequest'
 *                 - type: object
 *                   description: Admin response with pagination
 *                   properties:
 *                     invoiceRequests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InvoiceRequest'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         pageSize:
 *                           type: number
 *                         total:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *       400:
 *         description: Invalid status filter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin access required (for admin queries)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch invoice requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Get invoice requests (user's own or all for admin)  
**Authentication**: Required  
**Query Parameters**:
- `admin` (boolean): Request admin view
- `status`, `sortBy`, `sortOrder`, `page`, `pageSize`: Admin filtering options
**Service Functions**: `getAllInvoiceRequests()`, `getProfileInvoiceRequests()`  
**Response**: Invoice requests array with optional pagination  
**Used by**: Invoice management dashboard  

### POST /api/invoice-requests/create
/**
 * @swagger
 * /api/invoice-requests/create:
 *   post:
 *     summary: Create a new invoice request
 *     description: |
 *       Creates a new invoice request for advertising services. Includes comprehensive
 *       server-side price validation to prevent client-side price manipulation.
 *       Supports discount codes and different item types (box advertising, service advertising, sponsored placement).
 *     tags:
 *       - Invoice Requests
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - address
 *               - postalCode
 *               - city
 *               - phone
 *               - email
 *               - amount
 *               - description
 *               - itemType
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Customer's full name
 *                 example: "Ola Nordmann"
 *               address:
 *                 type: string
 *                 description: Billing address
 *                 example: "Storgata 1"
 *               postalCode:
 *                 type: string
 *                 description: Postal code
 *                 example: "0001"
 *               city:
 *                 type: string
 *                 description: City
 *                 example: "Oslo"
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+47 900 00 000"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "ola@example.com"
 *               amount:
 *                 type: number
 *                 description: Invoice amount (will be validated server-side)
 *                 example: 1499
 *               discount:
 *                 type: number
 *                 description: Discount amount (optional, defaults to 0)
 *                 example: 150
 *               description:
 *                 type: string
 *                 description: Description of the service/product
 *                 example: "Box advertising for 6 months"
 *               itemType:
 *                 type: string
 *                 enum: [BOX_ADVERTISING, SERVICE_ADVERTISING, BOX_SPONSORED]
 *                 description: Type of service being invoiced
 *                 example: "BOX_ADVERTISING"
 *               months:
 *                 type: number
 *                 description: Duration in months (for advertising)
 *                 example: 6
 *               days:
 *                 type: number
 *                 description: Duration in days (for sponsored placement)
 *                 example: 7
 *               slots:
 *                 type: number
 *                 description: Number of slots (if applicable)
 *                 example: 1
 *               stableId:
 *                 type: string
 *                 description: Associated stable ID
 *                 example: "stable-123"
 *               serviceId:
 *                 type: string
 *                 description: Associated service ID
 *                 example: "service-123"
 *               boxId:
 *                 type: string
 *                 description: Associated box ID(s), comma-separated for multiple
 *                 example: "box-123,box-456"
 *               discountCode:
 *                 type: string
 *                 description: Applied discount code
 *                 example: "SUMMER2024"
 *               discountCodeId:
 *                 type: string
 *                 description: Discount code record ID
 *                 example: "discount-123"
 *     responses:
 *       200:
 *         description: Invoice request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceRequest:
 *                   $ref: '#/components/schemas/InvoiceRequest'
 *                 message:
 *                   type: string
 *                   example: "Invoice request created successfully. Your purchase has been activated and you will receive an invoice by email."
 *       400:
 *         description: Validation error (missing fields, price mismatch, invalid discount code)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Price validation failed. Please refresh the page and try again."
 *                     expected:
 *                       type: number
 *                       example: 1499
 *                     received:
 *                       type: number
 *                       example: 1299
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create invoice request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Create a new invoice request with price validation  
**Authentication**: Required  
**Body**: Complete invoice request data with billing information  
**Service Functions**: `createInvoiceRequest()`, price validation functions  
**Response**: `{ invoiceRequest, message }`  
**Used by**: Advertising purchase flows, service purchase flows  

---

## Discount Codes API

### POST /api/discount-codes/validate
/**
 * @swagger
 * /api/discount-codes/validate:
 *   post:
 *     summary: Validate a discount code
 *     description: |
 *       Validates a discount code for a specific item type and amount.
 *       Returns validation result with discount information if valid.
 *       Checks code expiration, usage limits, and item type compatibility.
 *     tags:
 *       - Discount Codes
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - amount
 *               - itemType
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code to validate (case insensitive)
 *                 example: "SUMMER2024"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Order amount to apply discount to
 *                 example: 1499
 *               itemType:
 *                 type: string
 *                 enum: [BOX_ADVERTISING, SERVICE_ADVERTISING, BOX_SPONSORED]
 *                 description: Type of item the discount applies to
 *                 example: "BOX_ADVERTISING"
 *     responses:
 *       200:
 *         description: Discount code validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   description: Whether the discount code is valid
 *                   example: true
 *                 discountCodeId:
 *                   type: string
 *                   description: ID of the discount code record (if valid)
 *                   example: "discount-123"
 *                 discountAmount:
 *                   type: number
 *                   description: Amount of discount to apply (if valid)
 *                   example: 224.85
 *                 finalAmount:
 *                   type: number
 *                   description: Final amount after discount (if valid)
 *                   example: 1274.15
 *                 errorMessage:
 *                   type: string
 *                   description: Error message if invalid
 *                   example: "Discount code has expired"
 *                 discountType:
 *                   type: string
 *                   enum: [PERCENTAGE, FIXED_AMOUNT]
 *                   description: Type of discount (if valid)
 *                   example: "PERCENTAGE"
 *                 discountValue:
 *                   type: number
 *                   description: Discount value (percentage or fixed amount)
 *                   example: 15
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
**Description**: Validate a discount code for specific item type and amount  
**Authentication**: None  
**Body**: `{ code: string, amount: number, itemType: InvoiceItemType }`  
**Service Functions**: `validateDiscountCode()`  
**Response**: Validation result with discount information  
**Used by**: Discount code input components in purchase flows  

---

## Schema Definitions

### ErrorResponse
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}
```

### InvoiceRequest
```typescript
interface InvoiceRequest {
  id: string;
  profileId: string;
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  amount: number;
  discount: number;
  description: string;
  itemType: 'BOX_ADVERTISING' | 'SERVICE_ADVERTISING' | 'BOX_SPONSORED';
  status: 'PENDING' | 'INVOICE_SENT' | 'PAID' | 'CANCELLED';
  months?: number;
  days?: number;
  slots?: number;
  stableId?: string;
  serviceId?: string;
  boxId?: string;
  discountCode?: string;
  discountCodeId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Box
```typescript
interface Box {
  id: string;
  name: string;
  description?: string;
  size: string;
  pricePerMonth: number;
  isAvailable: boolean;
  boxType: 'boks' | 'utegang';
  stableId: string;
  advertisingExpiresAt?: Date;
  sponsoredUntil?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}
```
