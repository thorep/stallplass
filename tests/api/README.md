# Stallplass API Testing Framework

Comprehensive API test suite for all Stallplass endpoints using [Playwright API Testing](https://playwright.dev/docs/api-testing).

## 📋 Overview

This test framework provides complete coverage of all 48+ API endpoints in the Stallplass application, including:

- **Authentication & Authorization** testing
- **CRUD operations** for all resources
- **Multi-user scenarios** and workflows
- **Norwegian data handling** (æ, ø, å characters)
- **Business logic validation**
- **Error handling** and edge cases
- **Data cleanup** after tests

## 🏗️ Architecture

```
tests/api/
├── playwright.config.ts          # Main test configuration
├── utils/
│   └── auth-helpers.ts           # Authentication and test utilities
└── tests/
    ├── stables.user1.api.spec.ts          # Stable management tests
    ├── stables-individual.user1.api.spec.ts # Individual stable operations
    ├── boxes.user1.api.spec.ts            # Box management tests
    ├── users.user1.api.spec.ts            # User management tests
    ├── admin.user1.api.spec.ts            # Admin endpoint tests
    ├── conversations.user1.api.spec.ts    # Single-user conversation tests
    ├── conversations.user2.api.spec.ts    # Multi-user conversation tests
    ├── rentals.user1.api.spec.ts          # Rental management tests
    ├── payments.user1.api.spec.ts         # Payment processing tests
    ├── reviews.user1.api.spec.ts          # Review system tests
    ├── analytics.user1.api.spec.ts        # Analytics and tracking tests
    ├── amenities.user1.api.spec.ts        # Amenity management tests
    ├── services.user1.api.spec.ts         # Service marketplace tests
    └── locations.public.api.spec.ts       # Norwegian location data tests
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x
- Development server running on `http://localhost:3000`
- Supabase database with test users configured

### Installation

```bash
cd tests/api
npm install
npx playwright install
```

### Basic Usage

```bash
# Run all API tests
npm test

# Run tests by user type
npm run test:user1    # Tests requiring user1 authentication
npm run test:user2    # Tests requiring user2 authentication  
npm run test:public   # Public endpoints (no auth required)
npm run test:admin    # Admin-only endpoints

# Run specific endpoint tests
npm run test:stables
npm run test:boxes
npm run test:payments
npm run test:conversations

# Run with UI for debugging
npm run test:ui

# Generate HTML report
npm run test:html
npm run test:report
```

## 📊 Test Coverage

### Core Resources
- ✅ **Stables** - CRUD, search, filtering, FAQ management, box relationships
- ✅ **Boxes** - CRUD, search, filtering, sponsorship, amenity relationships  
- ✅ **Users** - User management, profile updates, authentication
- ✅ **Admin** - User management, system administration, pricing controls

### Business Workflows
- ✅ **Conversations** - Multi-user messaging, rental negotiations
- ✅ **Rentals** - Rental lifecycle, status transitions, confirmations
- ✅ **Payments** - Vipps integration, payment processing, history tracking
- ✅ **Reviews** - Two-way review system, rental-based reviews

### Supporting Systems
- ✅ **Analytics** - Page views, user tracking, privacy controls
- ✅ **Amenities** - Stable and box amenities, categorization
- ✅ **Services** - Service marketplace, Norwegian business rules
- ✅ **Locations** - Norwegian location hierarchy (fylker, kommuner, tettsteder)

## 🔐 Authentication

The test framework supports multiple authentication modes:

### Test Mode Authentication
```typescript
// Uses special test headers for API testing
const apiContext = await createAuthenticatedAPIContext(request, 'user1');
```

### Real Authentication (when configured)
```typescript
// Uses actual Supabase authentication flow
const authResult = await authenticateWithSupabase('user1@test.com', 'password');
```

### Test Users
- **user1@test.com** - Regular user with stables and boxes
- **user2@test.com** - Regular user for multi-user scenarios
- Both users have admin permissions for admin endpoint testing

## 🧪 Test Categories

### 1. Authentication Tests
```typescript
test('should require authentication for protected endpoints', async () => {
  await expectUnauthorized(unauthenticatedRequest, '/api/stables', 'POST');
});
```

### 2. Authorization Tests  
```typescript
test('should prevent access to other users data', async () => {
  const response = await apiContext.get(`/api/stables?owner_id=${otherUserId}`);
  await expectErrorResponse(response, 401);
});
```

### 3. CRUD Operation Tests
```typescript
test('should create resource with valid data', async () => {
  const response = await apiContext.post('/api/stables', { data: testData });
  const created = await expectSuccessfulResponse(response, 201);
  expect(created).toHaveProperty('id');
});
```

### 4. Multi-User Workflow Tests
```typescript
test('should allow message exchange between users', async () => {
  // User1 creates conversation
  // User2 responds with message
  // Both users can see conversation
});
```

### 5. Norwegian Data Tests
```typescript
test('should handle Norwegian characters correctly', async () => {
  const data = { name: 'Ålesund Rideskole', location: 'Tromsø' };
  const response = await apiContext.post('/api/stables', { data });
  const created = await expectSuccessfulResponse(response, 201);
  expect(created.name).toBe('Ålesund Rideskole');
});
```

## 🛠️ Test Utilities

### Authentication Helpers
```typescript
import { 
  createAuthenticatedAPIContext,
  expectUnauthorized,
  expectSuccessfulResponse,
  expectErrorResponse
} from '../utils/auth-helpers';
```

### Test Data Generators
```typescript
const stableData = generateTestStableData({
  name: 'Custom Test Stable',
  location: 'Oslo'
});

const boxData = generateTestBoxData(stableId, {
  price: 2500,
  is_indoor: true
});
```

### Cleanup Functions
```typescript
// Automatically clean up test data
await cleanupTestData(apiContext, { 
  stables: createdStableIds,
  boxes: createdBoxIds 
});
```

## ⚙️ Configuration

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  baseURL: 'http://localhost:3000',
  projects: [
    { name: 'api-user1', use: { storageState: 'e2e/.auth/user1.json' }},
    { name: 'api-user2', use: { storageState: 'e2e/.auth/user2.json' }},
    { name: 'api-public' },
    { name: 'api-admin' }
  ]
});
```

### Environment Variables
```bash
# Test environment
NODE_ENV=test

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📈 Performance Testing

Tests include performance validations:

```typescript
test('should respond within acceptable time limits', async () => {
  const start = Date.now();
  const response = await apiContext.get('/api/stables');
  const duration = Date.now() - start;
  
  expect(response.status()).toBe(200);
  expect(duration).toBeLessThan(5000); // 5 second limit
});
```

## 🚨 Error Scenarios

Comprehensive error testing:

```typescript
// Test missing required fields
test('should validate required fields', async () => {
  const response = await apiContext.post('/api/stables', { data: {} });
  await expectErrorResponse(response, 400);
});

// Test invalid data types
test('should validate data types', async () => {
  const invalidData = { totalBoxes: 'not-a-number' };
  const response = await apiContext.post('/api/stables', { data: invalidData });
  expect([400, 500]).toContain(response.status());
});
```

## 🔍 Debugging

### Debug Mode
```bash
npm run test:debug
```

### UI Mode
```bash
npm run test:ui
```

### Verbose Logging
```bash
DEBUG=pw:api npm test
```

### Individual Test Debugging
```bash
npx playwright test tests/stables.user1.api.spec.ts --debug
```

## 📋 Test Reports

### HTML Report
```bash
npm run test:html
npm run test:report  # Open report in browser
```

### CI/CD Reports
```bash
npm run test:ci  # Generates both line and HTML reports
```

### Coverage Analysis
```bash
npm run test:coverage  # Generates JSON report for analysis
```

## 🛡️ Security Testing

The framework includes comprehensive security tests:

- **Authentication bypass attempts**
- **Authorization escalation tests**
- **Data access control validation**
- **Input sanitization verification**
- **SQL injection prevention**
- **Cross-user data access prevention**

## 🌍 Norwegian-Specific Testing

Special focus on Norwegian business requirements:

- **Norwegian characters (æ, ø, å)** in all text fields
- **Location hierarchy** (fylke → kommune → tettsted)
- **Postal code formats** and validation
- **Norwegian business rules** for services
- **Multi-county service coverage**
- **Norwegian sorting and collation**

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: |
    cd tests/api
    npm install
    npx playwright install
    npm run test:ci
```

### Test Results
- **JUnit XML** for CI integration
- **HTML reports** for detailed analysis
- **JSON output** for custom processing
- **Screenshots** for visual debugging

## 📝 Contributing

When adding new API endpoints:

1. Create test file following naming convention: `endpoint.user1.api.spec.ts`
2. Include all CRUD operations if applicable
3. Test authentication and authorization
4. Add data validation tests
5. Include error handling scenarios
6. Add cleanup for created test data
7. Update this README with new endpoint coverage

## 🔧 Troubleshooting

### Common Issues

**Test authentication failures:**
```bash
# Ensure test users exist in database
# Check Supabase configuration
# Verify development server is running
```

**Database connection errors:**
```bash
# Start Supabase locally
npm run db:start

# Reset database if needed
npm run db:reset
```

**Port conflicts:**
```bash
# Ensure port 3000 is available
# Check no other development servers running
```

### Debug Commands
```bash
# Check test configuration
npx playwright test --list

# Validate test files
npx playwright test --dry-run

# Run single test with full output
npx playwright test tests/stables.user1.api.spec.ts --headed --debug
```

---

This comprehensive API testing framework ensures the reliability, security, and correctness of all Stallplass API endpoints, supporting both development workflows and production deployment confidence.