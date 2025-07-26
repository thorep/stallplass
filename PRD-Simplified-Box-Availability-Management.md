# Product Requirements Document: Simplified Box Availability Management

## Executive Summary

**Project:** Simplify Rental Management System  
**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft

### Overview
This PRD outlines the migration from the current complex rental tracking system to a simplified box availability management approach. The change eliminates formal rental relationship tracking in favor of a simple availability toggle system managed by stable owners.

## Current State Analysis

### What We Have Now
- **Rental Tracking System**: Full rental relationship management with `rentals` table
- **Mine Leieforhold**: Rider dashboard section for managing rental relationships  
- **Stable Owner Rental Management**: Dashboard section for owners to manage incoming rental requests
- **Complex Workflow**: Conversation → Rental Request → Rental Confirmation → Active Rental
- **Database Tables**: `rentals`, `conversations`, `messages` with rental-specific message types

### Pain Points
- **Over-engineering**: Complex system for what is essentially availability management
- **User Confusion**: Multiple steps and states for a simple "is this box available?" question
- **Maintenance Overhead**: Complex rental state management, status transitions, and relationship tracking
- **UX Friction**: Multiple dashboard sections and workflows for simple availability updates

## Proposed Solution

### Core Concept
**Replace formal rental tracking with simple availability management controlled by stable owners.**

### Key Changes

#### 1. **Remove Rental Relationship Tracking**
- **Eliminate**: `Mine Leieforhold` dashboard section for riders
- **Eliminate**: Stable owner rental management dashboard section  
- **Simplify**: Use only `boxes.isAvailable` field for availability state
- **Archive**: Existing `rentals` table data (keep for historical records but don't use in app logic)

#### 2. **Simplified Availability Management**
- **Primary Control**: Stable management page with box availability toggles
- **Secondary Control**: Chat-based "Mark as Rented" button for immediate updates
- **Single Source of Truth**: `boxes.isAvailable` field determines box availability

#### 3. **Enhanced Chat Integration**
- **Quick Action Button**: "I have rented this box out" button in relevant chat conversations
- **Immediate Update**: Button updates `boxes.isAvailable = false` and sends system message
- **Context Awareness**: Button only appears for stable owners in box-related conversations

## Detailed Requirements

### 1. Database Schema Changes

#### Remove from Active Use
```sql
-- Keep table for historical data but remove from app logic
-- tables: rentals, rental_status_service functionality
```

#### Update Core Logic
```sql
-- Primary availability field (already exists)
boxes.isAvailable: Boolean

-- Remove rental-dependent search logic
-- Update box search to only consider isAvailable field
```

### 2. Dashboard Updates

#### Remove Sections
- **Rider Dashboard**: Remove "Mine Leieforhold" tab entirely
- **Stable Owner Dashboard**: Remove rental management tab
- **Navigation**: Update tab structure and routing

#### Enhanced Stable Management
```typescript
// Stable Management Page Enhancement
interface StableManagementView {
  stableInfo: StableDetails
  boxes: BoxWithAvailability[]
  quickActions: {
    toggleBoxAvailability: (boxId: string) => Promise<void>
    bulkUpdateAvailability: (updates: BoxUpdate[]) => Promise<void>
  }
}

interface BoxWithAvailability {
  id: string
  name: string
  price: number
  isAvailable: boolean
  lastUpdated: Date
  currentRenter?: string // Optional display name if set via chat
}
```

### 3. Chat System Enhancements

#### New Message Types
```typescript
enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  BOX_RENTED = 'BOX_RENTED',     // New: When box is marked as rented
  BOX_AVAILABLE = 'BOX_AVAILABLE' // New: When box is marked as available
}
```

#### Chat Interface Updates
```typescript
interface ChatWithBoxActions {
  conversationId: string
  boxId?: string
  stableId: string
  isStableOwner: boolean
  boxAvailabilityActions?: {
    canMarkAsRented: boolean
    canMarkAsAvailable: boolean
    currentStatus: 'available' | 'rented'
  }
}

// New action component
interface BoxAvailabilityButton {
  text: 'Mark as Rented' | 'Mark as Available'
  action: () => Promise<void>
  disabled: boolean
  loading: boolean
}
```

### 4. Box Search & Display Updates

#### Simplified Search Logic
```typescript
// Remove rental-based occupancy filtering
interface BoxFilters {
  // Remove: occupancyStatus?: 'all' | 'available' | 'occupied'
  isAvailable?: boolean  // Simplified to just available/unavailable
  minPrice?: number
  maxPrice?: number
  // ... other existing filters
}

// Updated search function
export async function searchBoxes(filters: BoxFilters): Promise<BoxWithStablePreview[]> {
  const where: any = {
    isAdvertised: true,
    // Remove complex rental-based availability logic
    ...(filters.isAvailable !== undefined && { isAvailable: filters.isAvailable })
  }
  // ... rest of search logic
}
```

### 5. API Endpoint Changes

#### New Endpoints
```typescript
// Box availability management
POST /api/boxes/:id/availability
PUT /api/boxes/:id/toggle-availability
POST /api/chat/:conversationId/mark-box-rented

// Enhanced stable management
GET /api/stables/:id/boxes-with-status
PUT /api/stables/:id/bulk-update-boxes
```

#### Remove/Deprecate
```typescript
// Remove rental-specific endpoints
// DELETE: /api/rentals/*
// DELETE: /api/dashboard/mine-leieforhold
// DELETE: /api/dashboard/rental-management
```

### 6. User Interface Specifications

#### Stable Management Page
```jsx
// Enhanced Box Management Component
<BoxManagementTable>
  <BoxRow>
    <BoxInfo name={box.name} price={box.price} />
    <AvailabilityToggle 
      isAvailable={box.isAvailable}
      onChange={(available) => updateBoxAvailability(box.id, available)}
    />
    <LastUpdated date={box.lastUpdated} />
    <QuickActions boxId={box.id} />
  </BoxRow>
</BoxManagementTable>
```

#### Chat Integration
```jsx
// New Chat Action Component
<ChatMessage>
  {message.content}
  {isStableOwner && boxId && (
    <BoxAvailabilityActions 
      boxId={boxId}
      currentStatus={boxStatus}
      onStatusChange={handleBoxStatusChange}
    />
  )}
</ChatMessage>
```

#### Dashboard Navigation Update
```jsx
// Updated Dashboard Tabs (Remove Rental Tabs)
<DashboardTabs>
  <Tab>Oversikt</Tab>
  <Tab>Mine staller</Tab>
  {/* Remove: <Tab>Leieforhold</Tab> */}
  <Tab>Tjenester</Tab>
  <Tab>Analyse</Tab>
</DashboardTabs>
```

## Current Implementation Analysis

### Code Files Requiring Changes

#### 1. Dashboard Components - Remove "Mine Leieforhold" 
**`/src/app/dashboard/page.tsx`**
- **Lines 438-576**: Remove entire "Rentals Tab" section
- **Lines 48-52**: Remove rental queries and real-time hooks
- **Lines 307-318**: Remove rental stats from overview cards
- **Lines 393-431**: Remove "Rented Out Boxes" section

**`/src/components/organisms/StallClient.tsx`**
- **Lines 146-147**: Remove "Leieforhold" tab from navigation
- **Lines 393-431**: Remove rental display in stable management

**`/src/components/organisms/LeieforholdClient.tsx`**
- **Entire file**: Remove or significantly simplify this component

#### 2. API Routes to Remove/Simplify
**`/src/app/api/rentals/route.ts`**
- Remove complex rental management endpoints
- Keep minimal status tracking if needed

#### 3. Box Search Logic Updates
**`/src/services/box-service.ts`**
- **Lines 407-421**: Remove rental-based occupancy filtering:
```typescript
// REMOVE this complex logic:
if (occupancyStatus === 'available') {
  where.rentals = { none: { status: 'ACTIVE' } };
} else if (occupancyStatus === 'occupied') {
  where.rentals = { some: { status: 'ACTIVE' } };
}

// REPLACE with simple:
if (filters.isAvailable !== undefined) {
  where.isAvailable = filters.isAvailable;
}
```

#### 4. Remove Complex UI Components
- **`/src/components/organisms/RealTimeRentalDashboard.tsx`** - Remove entire file
- **`/src/components/organisms/RenterRentalTracker.tsx`** - Remove entire file  
- **`/src/components/organisms/RealTimeRentalAnalytics.tsx`** - Remove entire file
- **`/src/components/molecules/RentalReviewManager.tsx`** - Remove entire file

#### 5. TanStack Query Hooks Cleanup
**`/src/hooks/useRentalQueries.ts`**
- **Lines 41-135**: Remove complex rental query hooks
- **Lines 157-168**: Remove `useRentalStats()` hook

#### 6. Chat Integration Changes
**`/src/components/molecules/ConversationList.tsx`**
- **Lines 67-87**: Update status display logic
- **Lines 169-175**: Remove "RENTAL_CONFIRMED" status badges

**New component needed**: `BoxAvailabilityButton.tsx` for chat integration

#### 7. Type Definition Updates
- Remove `occupancyStatus` from `BoxFilters` interface
- Simplify rental types in `rental-service.ts`
- Update conversation types to remove rental relationships

#### 8. Database Schema Simplification
**`/prisma/schema.prisma`**
- Consider archiving `rentals` table (keep for historical data)
- Remove rental relations from `boxes` and `conversations` models
- Focus on `boxes.isAvailable` as single source of truth

## Implementation Plan

### Phase 1: Backend Preparation (Week 1-2)
1. **Service Layer Updates**
   - Update `box-service.ts` to remove rental-dependent search logic
   - Simplify `rental-service.ts` to minimal functionality
   - Create new box availability management endpoints

2. **Database Migration**
   - Archive existing rental data for historical reference
   - Update box search queries to use only `isAvailable` field
   - Remove rental-dependent database constraints

### Phase 2: Dashboard Updates (Week 2-3)
1. **Remove Rental Dashboard Sections**
   - Remove Mine Leieforhold components
   - Remove stable owner rental management
   - Update navigation and routing

2. **Enhanced Stable Management**
   - Add box availability toggle interface
   - Implement bulk update functionality
   - Add last-updated timestamps

### Phase 3: Chat Integration (Week 3-4)
1. **Chat Action Buttons**
   - Add stable owner availability controls
   - Implement system message generation
   - Update message type handling

2. **Real-time Updates**
   - Ensure availability changes reflect immediately
   - Update box search results in real-time

### Phase 4: Testing & Cleanup (Week 4-5)
1. **Integration Testing**
   - Test all availability update flows
   - Verify box search accuracy
   - Test chat integration

2. **Data Migration**
   - Archive old rental data
   - Clean up unused code
   - Update documentation

## Success Metrics

### User Experience
- **Reduced Clicks**: From 5+ steps to manage rental to 1 click availability toggle
- **Faster Updates**: Immediate availability changes vs. multi-step rental process
- **Simplified Mental Model**: "Available/Rented" vs. complex rental states

### Technical Benefits  
- **Code Reduction**: Remove ~20% of rental-related code
- **Simplified Database**: Reduce active table relationships
- **Improved Performance**: Faster box searches without rental joins

### Business Impact
- **Reduced Support**: Fewer user questions about complex rental flows
- **Higher Engagement**: Simpler availability management encourages more frequent updates
- **Better Data Accuracy**: Direct stable owner control vs. complex state transitions

## Risk Assessment

### Low Risk
- **Data Loss**: Existing rental data preserved for historical reference
- **Core Functionality**: Box search and display logic simplified, not broken

### Medium Risk  
- **User Adoption**: Need to educate users on new simplified workflow
- **Chat UX**: New buttons must be intuitive and discoverable

### Mitigation Strategies
- **Gradual Rollout**: Deploy to test users first
- **Clear Communication**: Update help documentation and user guides
- **Fallback Plan**: Keep rental data intact for potential rollback

## Conclusion

This simplified availability management approach reduces complexity while maintaining core functionality. By focusing on the essential question "Is this box available?" rather than managing complex rental relationships, we create a more intuitive and maintainable system.

The changes align with user behavior patterns where stable owners simply want to mark boxes as available or rented, without the overhead of formal rental relationship management.