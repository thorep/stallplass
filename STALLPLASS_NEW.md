# Stallplass.no - Platform Documentation

## Overview

Stallplass.no is a Norwegian platform that connects stable owners with horse riders, and service providers with potential customers. The platform operates on a paid advertising model where:

- **Stable owners** can manage their facilities and advertise individual box listings
- **Service providers** (veterinarians, farriers, trainers, etc.) can advertise their services
- **Horse riders** can search and find available boxes and services

**Key Business Model**: Stables and boxes only appear in public search results when they have active paid advertising. Service providers also pay for their service listings to be visible.

## Core User Journey

### 1. Authentication & Access
- Users log in via email and password using Supabase Auth
- Protected routes include `/dashboard` and related management pages
- Unauthenticated users can browse public listings

### 2. Homepage (`/`)
- Landing page with primary search functionality
- Municipality and county search with autocomplete
- Search redirects to `/staller` with location filter applied
- First impression and conversion point for new users

### 3. Search & Discovery (`/staller`)
**User Experience**:
- Filter and search for stables or individual boxes
- Comprehensive filtering options (location, price, amenities, availability)
- Toggle option: "Show rented out boxes" to include unavailable listings

**Visibility Rules**:
- **Stables**: All stables appear in search results
- **Boxes**: Only boxes with `isAdvertised=true` appear in search
- **Availability**: Boxes show regardless of `isAvailable` status when "Show rented out boxes" is enabled
- **Sponsored Results**: Boxes with `isSponsored=true` appear at top with "Sponsored" pill

**Navigation**:
- Click stable → Public stable page
- Click box → Public box page (also accessible from stable page)

### 4. Public Stable Page (`/staller/[stableId]`)
**Content**:
- Stable information, photos, descriptions, amenities
- Interactive map showing stable location
- All boxes with `isAdvertised=true` listed
- Unavailable boxes marked with "Not available" pill
- Related services in the same geographic area listed at bottom

**Critical Rule**: Only boxes with `isAdvertised=true` are visible, regardless of availability status.

### 5. Public Box Page (`/staller/[stableId]/[boxId]`)
**Content**:
- Detailed box information (similar to stable page layout)
- Interactive map showing box location
- "Start Conversation" button for interested riders
- Related services in the same geographic area listed at bottom

### 6. Messaging System (`/conversations`)
**Features**:
- All user conversations displayed
- For stable owners: "I have rented out this box" shortcut button
- Regular messaging interface for riders
- Direct line of communication between parties

### 7. Dashboard Management (`/dashboard`)

#### 7.1 Overview Tab
- Statistics and metrics summary
- Conditional action buttons:
  - "Create your first stable" (if no stables exist)
  - "Create your first service" (if no services exist)

#### 7.2 Mine Staller (My Stables)
**Capabilities**:
- Create new stables
- Edit existing stable information
- Add and manage boxes within stables
- Start advertising campaigns
- Mark boxes as rented out (only for advertised boxes)
- Boost individual boxes with sponsored placement (`isSponsored=true`)

**Important**: Boxes require advertising to be visible anywhere except the dashboard.

#### 7.3 Leieforhold (Rental Relationships)
*Note: This section can be removed as per business requirements.*

#### 7.4 Tjenester (Services)
**Service Management**:
- Create new service listings
- Manage existing services
- Services require `advertisingActive=true` for public visibility
- Toggle `isActive=false` to temporarily hide active services

**Geographic Coverage**:
- Select one or more service areas using `service_areas` table
- Can choose broad coverage (entire counties) or specific municipalities
- Example: Cover all of Vestfold county + specific Sandefjord municipality

**Pricing Options**:
- Set fixed price OR price range (min/max)

### 8. Analytics (`/analyse`)
- View and track engagement metrics
- Monitor listing performance and user interactions

### 9. Pricing (`/priser`)
**Calculator Types**:
1. **Box Advertising**: 
   - Volume discounts for 5+ and 10+ boxes
   - Duration discounts for 3, 6, 12 months
2. **Sponsored Listings**: 
   - Price per box per day
   - Duration discounts for 30, 60, 90 days
3. **Service Advertising**:
   - Daily pricing with duration discounts for 30, 60, 90 days

**Configuration**: All pricing and discounts controlled by database with code fallbacks.

### 10. Suggestion Box (`/forslag`)
**Purpose**: Platform improvement through user feedback
**Features**:
- Simple form for users to submit suggestions
- Text area for detailed feedback
- Optional contact information for follow-up
- Suggestions stored in database for review
- Accessible via header navigation link
- Helps improve Stallplass.no based on user needs

## Database Schema Requirements vs Current State

### ❌ Required Changes

#### User Model Issues
**Current Problems**:
- `users.firebaseId` field exists (should be removed)
- `users.bio` field exists (should be removed) 
- `users.rentals` relationship exists (should be removed)
- Missing `users.lastActiveAt` field for tracking user activity

**Required Actions**:
```sql
-- Remove firebaseId column (authentication handled separately)
-- Remove bio column (not needed)
-- Remove rentals relationship (rentals not connected to users)
-- Add lastActiveAt DateTime field to track user login/activity
```

#### Box Model Issues
**Current Problems**:
- `boxes.rentals` relationship exists (should be removed)

**Required Actions**:
```sql
-- Remove rentals relationship from boxes table
```

#### Conversations Model Issues
**Current Problems**:
- Field named `riderId` (should be `userId`)
- `conversations.rentals` relationship exists (should be removed)

**Required Actions**:
```sql
-- Rename riderId to userId
-- Remove rentals relationship
-- Ensure conversations only connect to boxes
```

### ✅ Correctly Implemented

#### Box Advertising Fields
- `boxes.isAdvertised` ✅
- `boxes.isAvailable` ✅ 
- `boxes.isSponsored` ✅
- `boxes.advertisingStartDate` ✅
- `boxes.advertisingUntil` ✅
- `boxes.sponsoredStartDate` ✅
- `boxes.sponsoredUntil` ✅

#### Service Advertising Fields
- `services.advertisingActive` ✅
- `services.advertisingEndDate` ✅
- `services.isActive` ✅

#### Geographic Data
- `counties` and `municipalities` tables ✅
- `service_areas` with county/municipality coverage ✅

#### Pricing Infrastructure
- `base_prices` table ✅
- `pricing_discounts` table ✅

### ⚠️ Verification Needed

The following areas need code review to ensure implementation matches business requirements:

1. **Search Logic**: Verify that box search properly filters by `isAdvertised=true`
2. **Public Pages**: Confirm that stable/box pages respect advertising status
3. **Dashboard Logic**: Ensure rental status changes only work on advertised boxes
4. **Pricing Calculations**: Verify discount and pricing logic uses database values

## Technical Architecture Notes

### Frontend
- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- TanStack Query for data fetching
- Zustand for UI state management

### Backend  
- PostgreSQL with Prisma ORM
- Supabase Auth for authentication
- Vipps payment integration
- RESTful API routes in Next.js

### Key Implementation Points
- All database operations use Prisma with type safety
- Authentication state managed server-side with middleware
- Public search results filtered by advertising status
- Payment flow determines listing visibility
- Geographic search using county/municipality hierarchy

## Current Implementation Status

### ✅ Implemented Features

#### Core Pages & Navigation
- **Homepage** (`/`) - Landing page with search ✅
- **Search Page** (`/staller`) - Box and stable search with filtering ✅
- **Public Stable Pages** (`/staller/[id]`) - Individual stable listings ✅
- **Public Box Pages** (`/bokser/[id]`) - Individual box listings ✅
- **Dashboard** (`/dashboard`) - Management interface ✅
- **Messaging** (`/meldinger`) - Conversation system ✅
- **Pricing** (`/priser`) - Pricing calculators ✅

#### Business Logic
- **Advertising Status**: `isAdvertised`, `isSponsored` fields implemented ✅
- **Geographic Search**: County/municipality filtering ✅
- **Payment Integration**: Vipps payment system ✅
- **Service Management**: Service listings with area coverage ✅
- **Sponsored Listings**: Premium placement functionality ✅

#### Dashboard Functionality
- **Overview Tab**: Basic statistics ✅
- **Mine Staller Tab**: Stable management ✅
- **Leieforhold Tab**: Rental management (marked for removal) ✅
- **Tjenester Tab**: Service management ✅

### ✅ Recently Completed

#### 1. Rental System Removal
**Status**: **COMPLETED** ✅
**What was done**:
- Removed `bio` field from users table
- Removed entire `rentals` table and relationships  
- Removed `reviews` table (dependent on rentals)
- Renamed `conversations.riderId` to `userId`
- Updated enum values (removed RENTAL_CONFIRMED, RENTAL_REQUEST, etc.)
- Deleted all rental-related services, components, and API routes
- Removed Leieforhold tab from dashboard
- Created safe migration script for production deployment

#### 2. Search Filter: "Show Rented Out Boxes"  
**Status**: **ALREADY IMPLEMENTED** ✅
**Discovery**: Feature was already fully implemented in search interface
**Current**: Occupancy filter with three options:
- "Kun ledige bokser" (Only available boxes)
- "Kun opptatte bokser" (Only occupied boxes)  
- "Alle bokser" (All boxes - shows both available and unavailable)
**Location**: SearchFilters.tsx component with proper backend filtering

### ❌ Missing Features

#### 1. Analytics as Separate Page (`/analyse`)
**Status**: **PARTIAL** - Exists as dashboard tab, not separate page
**Current**: Analytics exists within dashboard as a tab (`activeTab === "analytics"`)
**Expected**: Should be a separate page at `/analyse` route
**Required**: 
- Either create `/src/app/analyse/page.tsx` as standalone page
- OR update documentation to reflect current dashboard tab implementation

#### 2. Service Pricing Calculator UI
**Status**: **IMPLEMENTED** - Service pricing calculator exists
**Current**: Service pricing calculator is present in PricingClient.tsx
**Note**: Duration discounts may need database integration

#### 3. Homepage Municipality/County Search
**Status**: **COMPLETED** ✅
**What was done**:
- Created LocationSearchInput component with autocomplete functionality
- Integrates with existing location search API (`/api/locations/search`)
- Supports keyboard navigation (arrow keys, enter, escape)
- Redirects to `/staller` with appropriate location filters (fylkeId, kommuneId, or query)
- Handles fylke, kommune, and tettsted searches with proper formatting
- Replaced basic text search with proper location-based search

#### 6. Suggestion Box Page (`/forslag`)
**Status**: **MISSING** - User feedback system not implemented
**Description**: Page where users can submit suggestions to improve Stallplass.no
**Required Features**:
- Simple form with text area for suggestions
- Optional contact information fields
- Database table to store suggestions
- Header navigation link to access the page
- Thank you confirmation after submission

### ⚠️ Implementation Verification Needed

#### Dashboard Tab Navigation
**Current**: Dashboard has tabs but needs verification that all described functionality exists:
- [ ] Overview tab shows create buttons based on user data
- [ ] Mine Staller tab has all described box management features
- [ ] Tjenester tab has full service management capability
- [ ] Rental shortcuts work correctly in conversations

#### Search Results Behavior
**Current**: Search exists but needs verification of business rules:
- [ ] All stables appear in search (no advertising requirement)
- [ ] Only `isAdvertised=true` boxes appear in search
- [ ] `isSponsored=true` boxes appear at top with pill
- [ ] "Show rented out boxes" toggle functionality

## Code Issues Found

### 🔴 Critical Issues

#### 1. Heavy firebaseId Dependency
**Problem**: Despite requirement to remove firebaseId, it's deeply integrated:
- All foreign key relationships use `firebaseId` instead of `id`
- Authentication checks depend on firebaseId
- User lookups throughout codebase use firebaseId
**Impact**: Major refactoring needed to switch to regular id field
**Files affected**: 
- `/prisma/schema.prisma` - 12+ references
- `/src/services/*` - Multiple service files
- Authentication middleware

#### 2. Rental System Still Active
**Problem**: Rental system should be removed but is still implemented:
- `rentals` table exists with full relationships
- Rental management code in dashboard
- Rental types and queries throughout codebase
**Expected**: Simple isAvailable toggle, no rental tracking
**Files affected**: Multiple components and services

#### 3. Conversation Field Naming
**Problem**: Using `riderId` instead of `userId` in conversations
**Current**: All conversation queries and types use `riderId`
**Expected**: Should use generic `userId` field
**Impact**: Breaking change for existing conversations

### 🟡 Implementation Gaps

#### 1. Search Filtering Logic
**Good**: Box search correctly filters by `isAdvertised=true`
**Missing**: No option to show unavailable boxes
**Location**: `/src/services/box-service.ts:421`

#### 2. Analytics Location Mismatch
**Current**: Analytics is a dashboard tab
**Expected**: Separate `/analyse` page
**Decision needed**: Update docs or move to separate page

#### 3. Stable Owner Conversation Features
**Missing**: "I have rented out this box" button in conversations
**Impact**: Stable owners must go to dashboard to mark as rented

#### 4. Leieforhold Tab Should Be Removed
**Current**: Tab exists and displays rental information
**Expected**: Should be removed entirely per requirements
**Location**: Dashboard tab at index 2 (rentals)

### 🟢 Correctly Implemented

- ✅ Box advertising logic (`isAdvertised`, `isSponsored`)
- ✅ Service advertising fields and logic
- ✅ Geographic filtering with counties/municipalities
- ✅ Payment integration with Vipps
- ✅ Pricing calculators (including service pricing)
- ✅ Dashboard tab structure

## Migration Checklist

### Immediate Missing Features (High Priority)
- [x] **Add "Show Rented Out Boxes" filter** to search interface ✅ (Already implemented)
- [x] **Add rental shortcut button** in conversations for stable owners ✅ (Not needed - rental system removed)
- [ ] **Decide on Analytics location** (separate page vs dashboard tab)
- [x] **Verify Homepage Search** has municipality/county autocomplete ✅

### Database Schema Updates (Breaking Changes)
- [ ] Remove `users.firebaseId` field and migrate all references to `id` ⚠️ (Complex - may need architectural decision)
- [x] Remove `users.bio` field ✅
- [x] Remove entire `rentals` table and relationships ✅
- [x] Rename `conversations.riderId` to `conversations.userId` ✅
- [ ] Update all foreign key relationships from firebaseId to id ⚠️ (Pending firebaseId decision)

### Code Updates Required
- [ ] Update authentication logic to not rely on `users.firebaseId`
- [ ] Modify conversation queries to use `userId` instead of `riderId`
- [ ] Remove rental-related logic from user and box models
- [ ] Verify search filtering respects `isAdvertised` requirements
- [ ] Ensure pricing calculations use database values with fallbacks

### Testing Requirements
- [ ] Verify box visibility rules in search results
- [ ] Test advertising status transitions
- [ ] Confirm geographic filtering works correctly
- [ ] Validate pricing calculations
- [ ] Test conversation functionality after field rename
- [ ] Test new analytics page functionality
- [ ] Test "Show rented out boxes" filter

This documentation serves as the definitive guide for understanding and implementing the Stallplass.no platform according to business requirements.