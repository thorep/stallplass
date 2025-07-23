# E2E Testing Setup

## Prerequisites

Before running E2E tests, you need to create test users in your local Supabase instance:

### Required Test Users

1. **Test User 1**
   - Email: `user1@test.com`
   - Password: `test123`
   - Role: Regular user (can create stables, rent boxes, etc.)

2. **Test User 2**
   - Email: `user2@test.com`
   - Password: `test123`
   - Role: Regular user (can create stables, rent boxes, etc.)

### Creating Test Users

1. Start your local Supabase:
   ```bash
   npm run db:start
   ```

2. Open Supabase Studio:
   ```bash
   npm run db:studio
   ```

3. Go to Authentication → Users and create the two test users with the credentials above

4. (Optional) You can also run this SQL in the SQL Editor:
   ```sql
   -- This will create test users in your local Supabase Auth
   -- Note: You'll need to use the Supabase Dashboard to create auth users
   -- as they cannot be created via SQL directly
   ```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- stable-creation.spec.ts

# Run with specific browser
npm run test:e2e -- --project=chromium
```

## Test Coverage

The E2E tests cover these critical user flows:

1. **Authentication**
   - Login as stable owner
   - Login as rider
   - Logout

2. **Stable Management**
   - Create new stable
   - Edit stable details
   - Add/edit boxes
   - View stable as public user

3. **Search & Discovery**
   - Search stables by location
   - Filter by amenities
   - View on map

4. **Messaging**
   - Send inquiry about a box
   - Reply to messages
   - Real-time message updates

5. **Rental Flow**
   - Request rental
   - Accept/reject rental
   - End rental agreement

## Important Notes

- Tests run against `http://localhost:3000` by default
- The dev server will be started automatically if not running
- Screenshots are captured on failure in `e2e/test-results/`
- Test data is NOT cleaned up automatically - use a dedicated test database