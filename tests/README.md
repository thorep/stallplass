# Playwright End-to-End Tests for Stallplass

This directory contains Playwright E2E tests to verify that the Stallplass application works correctly from a user's perspective.

**Note**: This directory is separate from Jest unit tests (located in `src/__tests__/`) to follow Playwright best practices.

## Test Structure

### Test Files
- `auth.spec.ts` - User authentication (login, registration, logout)
- `stables.spec.ts` - Stable browsing, search, and filtering
- `booking.spec.ts` - Box booking and rental process
- `messaging.spec.ts` - Messaging system between users
- `admin.spec.ts` - Admin dashboard functionality

### Page Objects
- `pages/base-page.ts` - Common page functionality
- `pages/login-page.ts` - Login page interactions
- `pages/register-page.ts` - Registration page interactions
- `pages/stables-page.ts` - Stables search and browsing
- `pages/admin-page.ts` - Admin dashboard management

### Test Data
- `fixtures/test-data.ts` - Test data and utilities
- `auth.setup.ts` - Authentication setup for tests

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
# OR directly with npx
npx playwright test
```

### Specific Browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Mobile Tests
```bash
npm run test:e2e:mobile
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### View Test Reports
```bash
npm run test:e2e:report
```

## Test Environment

### Prerequisites
1. Database with test data
2. Running development server (`npm run dev`)
3. Test user accounts (created by setup scripts)

### Environment Variables
Tests use `.env.test` for configuration:
- Test database URL
- Firebase test configuration
- Test user credentials

### Authentication
Tests use Playwright's authentication mechanism:
- `auth.setup.ts` creates authenticated sessions
- Sessions are stored in `tests/.auth/`
- Tests reuse authentication state for performance

## Test Data

### Test Users
- Regular user for standard functionality
- Stable owner for stable management
- Admin user for administrative functions

### Test Stables
- Basic stable with standard features
- Premium stable with advanced features
- Various pricing and amenity configurations

## Best Practices

### Page Object Model
- Use page objects for reusable page interactions
- Keep test logic separate from UI implementation
- Make tests resilient to UI changes

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and atomic

### Waiting Strategies
- Use `expect().toBeVisible()` for assertions
- Wait for API calls with `waitForResponse()`
- Use custom wait helpers from BasePage

### Error Handling
- Tests should handle both success and error scenarios
- Check for loading states and error messages
- Verify API error responses

## CI/CD Integration

### GitHub Actions
Tests can be run in CI with:
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

### Test Reports
- HTML reports generated in `playwright-report/`
- Screenshots and videos for failed tests
- Trace files for debugging

## Debugging

### Debug Individual Test
```bash
npx playwright test auth.spec.ts --debug
```

### Record New Tests
```bash
npx playwright codegen localhost:3000
```

### View Trace Files
```bash
npx playwright show-trace test-results/trace.zip
```

## Common Issues

### Test Flakiness
- Ensure proper waits for elements
- Use stable selectors (data-testid)
- Handle async operations correctly

### Authentication
- Check that test users exist in database
- Verify Firebase test configuration
- Ensure auth state is properly saved/loaded

### Database State
- Tests should not depend on specific database state
- Use test-specific data when possible
- Clean up test data after runs

## Contributing

When adding new tests:
1. Follow existing patterns and structure
2. Add appropriate page objects for new pages
3. Update test data fixtures as needed
4. Ensure tests work across all browsers
5. Add mobile-specific tests for responsive features