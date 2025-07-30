# Stallplass Data Flow Documentation

## Overview

This document explains how data flows through the Stallplass application, from user actions to database updates. Understanding these flows is critical to avoid breaking existing functionality.

## Core Data Flow Pattern

```
User Action → Component → Hook → API Route → Service → Database
                ↓                      ↓           ↓
            TanStack Query      Authentication  Prisma ORM
                ↓                      ↓           ↓
            Cache/State          Validation    PostgreSQL
```

## Critical Business Rules

### 1. Box Visibility Requirements

**Rule**: Boxes ONLY appear in public search if:
- `boxes.is_active = true` AND
- Parent stable has `stables.advertising_active = true` AND
- Parent stable has `stables.advertising_end_date > NOW()`

**Flow**:
1. User searches for boxes on `/staller`
2. `BoxSearchFilters` component uses `useGetBoxes()` hook
3. Hook calls `GET /api/boxes` with filters
4. API route calls `searchBoxes()` service function
5. Service enforces advertising rules via SQL query
6. Only boxes meeting ALL criteria are returned

**Common Mistakes**:
- ❌ Forgetting to check stable advertising status
- ❌ Showing inactive boxes in search results
- ❌ Not joining with stables table to check advertising

### 2. Authentication Flow

**Pattern**: Client → Hook → API → Service → Database

**Example - Creating a Stable**:
```typescript
// 1. Component action
const { mutate: createStable } = usePostStable();
createStable(stableData);

// 2. Hook fetches with auth
const token = await getIdToken();
fetch('/api/stables', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. API validates auth
const userId = await getUserIdFromRequest(request);
if (!userId) return unauthorized();

// 4. Service creates with owner
const stable = await createStable({
  ...data,
  owner_id: userId
});
```

### 3. Real-time Updates

**Pattern**: Database Change → Supabase Webhook → Client Subscription

**Conversation/Message Flow**:
1. User sends message via `usePostMessage()`
2. API creates message in database
3. Supabase broadcasts change to subscribed clients
4. Other user's UI updates automatically
5. TanStack Query cache is invalidated

**Key Points**:
- Subscriptions are managed in hooks
- Unsubscribe on component unmount
- Handle connection errors gracefully

## Feature Dependencies

### Stable Management

**Dependencies**:
- User must be authenticated
- User creates stable (becomes owner)
- Stable requires location data (kommune/fylke)
- Stable amenities are many-to-many relations

**Data Flow**:
1. Create stable → generates stable ID
2. Add amenities → creates junction table entries
3. Upload images → stores in Supabase storage
4. Activate advertising → enables public visibility

### Box Management

**Dependencies**:
- Box MUST belong to a stable
- Stable owner manages all boxes
- Box amenities are separate from stable amenities
- Box visibility depends on stable advertising

**Data Flow**:
1. Create box → links to stable_id
2. Set pricing → stored in box record
3. Add amenities → junction table entries
4. Upload images → separate storage bucket
5. Activate advertising → makes searchable

### Invoice System

**Flow**: Feature Activation → Invoice Request → Manual Processing

1. **User Action**: Purchase advertising/boost
2. **Immediate Activation**: Feature enabled instantly
3. **Invoice Creation**: Request stored in database
4. **Admin Processing**: Manual invoice sent
5. **Payment Tracking**: Admin updates payment status

**Key Points**:
- Features activate BEFORE payment
- 14-day payment terms
- No external payment gateway needed

## State Management Patterns

### TanStack Query Keys

**Convention**: `[resource, action/filter, ...params]`

Examples:
- `['stables']` - All stables
- `['stables', 'by-owner', ownerId]` - Owner's stables
- `['boxes', 'by-stable', stableId]` - Stable's boxes
- `['conversations', userId]` - User's conversations

**Invalidation Patterns**:
```typescript
// After creating a stable
queryClient.invalidateQueries({ queryKey: ['stables'] });

// After updating a box
queryClient.invalidateQueries({ queryKey: ['boxes'] });
queryClient.invalidateQueries({ queryKey: ['boxes', 'by-stable', stableId] });

// After sending a message
queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
```

### Optimistic Updates

Used for instant UI feedback:
- Message sending
- Status toggles
- Simple property updates

**Pattern**:
```typescript
onMutate: async (newData) => {
  // Cancel queries
  await queryClient.cancelQueries({ queryKey });
  
  // Snapshot previous value
  const previous = queryClient.getQueryData(queryKey);
  
  // Optimistically update
  queryClient.setQueryData(queryKey, old => ({
    ...old,
    ...newData
  }));
  
  return { previous };
},
onError: (err, newData, context) => {
  // Rollback on error
  queryClient.setQueryData(queryKey, context.previous);
}
```

## Error Handling Patterns

### API Errors

**Standard Format**:
```json
{
  "error": "Descriptive error message",
  "status": 400
}
```

**Client Handling**:
```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || `HTTP ${response.status}`);
}
```

### Service Errors

**Pattern**: Throw descriptive errors
```typescript
if (!stable) {
  throw new Error('Stable not found');
}
if (stable.owner_id !== userId) {
  throw new Error('Unauthorized: Not stable owner');
}
```

## Database Transaction Patterns

### Multi-table Updates

**Example - Deleting a Stable**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Delete related data first
  await tx.conversations.deleteMany({ where: { stable_id: id } });
  await tx.messages.deleteMany({ where: { stable_id: id } });
  await tx.boxes.deleteMany({ where: { stable_id: id } });
  
  // 2. Delete junction tables
  await tx.stable_amenity_mappings.deleteMany({ where: { stable_id: id } });
  
  // 3. Delete main record
  await tx.stables.delete({ where: { id } });
});
```

### Creating Related Data

**Example - Creating Stable with Amenities**:
```typescript
const stable = await prisma.stables.create({
  data: {
    ...stableData,
    stable_amenity_mappings: {
      create: amenityIds.map(id => ({
        amenity_id: id
      }))
    }
  },
  include: {
    stable_amenity_mappings: {
      include: { stable_amenities: true }
    }
  }
});
```

## Common Breaking Points

### 1. Changing API Response Format
**Impact**: Breaks all consuming hooks and components
**Solution**: Version APIs or use backwards-compatible changes

### 2. Modifying Service Function Signatures
**Impact**: Breaks all API routes using the service
**Solution**: Create new functions rather than changing existing

### 3. Altering Database Schema
**Impact**: Can break queries and data integrity
**Solution**: Use proper migrations, never modify existing columns

### 4. Changing Authentication Flow
**Impact**: Can lock out all users
**Solution**: Test thoroughly, implement gradual rollout

### 5. Modifying Query Keys
**Impact**: Breaks cache invalidation
**Solution**: Search for all usages before changing

## Testing Considerations

### Required Test Coverage

1. **API Routes**: Test auth, validation, error cases
2. **Service Functions**: Test business logic, edge cases
3. **Hooks**: Test loading states, error handling
4. **Components**: Test user interactions, rendering

### Test Data Requirements

- Stables with/without advertising
- Boxes in various states
- Users with different roles
- Expired vs active features

## Performance Considerations

### Query Optimization

1. **Include Related Data**: Use Prisma includes to avoid N+1
2. **Pagination**: Implement for large datasets
3. **Indexes**: Ensure proper database indexes
4. **Caching**: Leverage TanStack Query caching

### Real-time Subscriptions

1. **Limit Subscriptions**: Only subscribe to needed data
2. **Cleanup**: Always unsubscribe on unmount
3. **Error Recovery**: Handle reconnection gracefully

## Deployment Considerations

### Pre-deployment Checklist

1. Run database migrations
2. Update environment variables
3. Clear caches if needed
4. Test critical flows
5. Monitor error rates

### Rollback Plan

1. Keep previous deployment ready
2. Database migrations should be reversible
3. Feature flags for risky changes
4. Monitor user reports

This documentation should be updated whenever significant changes are made to data flows or business logic.