# FirebaseId Architecture Decision - Stallplass.no

## Overview

This document analyzes the current firebaseId architecture in the Stallplass.no codebase and provides a recommendation for future development.

## Current State

### Database Schema
The current Prisma schema uses `firebaseId` as the primary identifier for user relationships across the entire system:

```prisma
model users {
  id                   String                 @id @default(dbgenerated("gen_random_uuid()"))
  firebaseId           String                 @unique  // This is the actual user identifier
  email                String                 @unique
  name                 String?
  // ... other fields
}
```

### Foreign Key Relationships
**All** foreign key relationships in the database reference `users.firebaseId` instead of `users.id`:

1. **conversations.userId** → `users.firebaseId`
2. **messages.senderId** → `users.firebaseId`  
3. **page_views.viewerId** → `users.firebaseId`
4. **payments.userId** → `users.firebaseId`
5. **stables.ownerId** → `users.firebaseId`
6. **services.userId** → `users.firebaseId`

### Authentication Flow
- Supabase Auth provides the `firebaseId` (actually Supabase user ID)
- This ID is used directly in database operations
- User lookup in database is performed via `firebaseId`

## Issues with Current Architecture

### 1. Misleading Naming
- Field is named `firebaseId` but actually contains Supabase user IDs
- This creates confusion about the authentication provider

### 2. Schema Inconsistency  
- Primary key `id` exists but is never used for relationships
- All relationships bypass the standard `id` field
- Non-standard database design pattern

### 3. Migration Complexity
- Changing from `firebaseId` to `id` would require updating:
  - 15+ foreign key constraints
  - All service layer functions
  - All API endpoints
  - Authentication middleware
  - Client-side code

### 4. Developer Confusion
- New developers expect `id` to be the relationship key
- Current pattern goes against database design conventions
- Requires extensive documentation for team onboarding

## Analysis: Migration vs. Status Quo

### Option 1: Migrate to Standard ID Pattern

**Advantages:**
- Standard database design pattern
- Clearer code for new developers  
- Future-proof architecture
- Eliminates naming confusion

**Disadvantages:**
- **High-risk migration** affecting all user relationships
- Requires coordinated deployment
- Potential for data inconsistency during migration
- Significant development time investment
- Risk of breaking existing integrations

### Option 2: Keep Current firebaseId Pattern

**Advantages:**
- **Zero migration risk**
- No breaking changes
- System works reliably as-is
- Immediate development focus on features

**Disadvantages:**
- Continues non-standard pattern
- Requires developer education
- Technical debt remains

## Recommendation: KEEP CURRENT ARCHITECTURE

### Decision: Maintain firebaseId Pattern

**Rationale:**
1. **Risk vs. Benefit**: The migration risk outweighs the benefits for a working system
2. **Business Priority**: Focus development resources on user-facing features  
3. **System Stability**: Current architecture is proven and stable
4. **Cost-Benefit**: Migration costs are high with minimal business impact

### Implementation Guidelines

#### 1. Rename Field (Low-Risk Improvement)
```prisma
model users {
  id                   String                 @id @default(dbgenerated("gen_random_uuid()"))
  supabaseId           String                 @unique  // Renamed from firebaseId
  email                String                 @unique
  // ...
}
```

#### 2. Update Documentation
- Document the architecture decision
- Create developer onboarding guide
- Add inline comments explaining the pattern

#### 3. Establish Conventions
- All new user relationships use `supabaseId`
- Consistent naming across codebase
- TypeScript types reflect the pattern

#### 4. Code Examples
```typescript
// Service pattern
async function getUserStables(supabaseId: string) {
  return prisma.stables.findMany({
    where: { ownerId: supabaseId }  // Uses supabaseId, not id
  });
}

// API pattern  
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  const stables = await getUserStables(user.id); // user.id is actually supabaseId
}
```

## Migration Path (If Required in Future)

Should business requirements change, here's the migration approach:

### Phase 1: Preparation
1. Create new `user_id_mapping` table
2. Populate with `id` → `firebaseId` mappings
3. Add database constraints

### Phase 2: Gradual Migration
1. Update one model at a time
2. Maintain dual foreign keys during transition
3. Test each model thoroughly

### Phase 3: Cleanup
1. Remove old `firebaseId` foreign keys
2. Drop mapping table
3. Update all service code

**Estimated Effort:** 2-3 weeks full-time development + testing

## Conclusion

The current firebaseId architecture, while non-standard, is **working reliably** and serves the business needs. The risk and complexity of migration outweigh the benefits.

**Recommendation:** Keep the current architecture with improved documentation and consistent naming (rename to `supabaseId`).

This decision prioritizes:
- ✅ System stability
- ✅ Development velocity  
- ✅ Business feature focus
- ✅ Risk minimization

---

**Decision Date:** January 27, 2025  
**Review Date:** Q2 2025 (if architectural needs change)  
**Status:** APPROVED - Maintain Current Architecture