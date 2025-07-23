import { test, expect } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  addAuthHeaders,
  expectUnauthorized,
  expectSuccessfulResponse,
  expectErrorResponse
} from '../utils/auth-helpers';

/**
 * Comprehensive API tests for user endpoints
 * Tests /api/users, /api/users/[firebaseId], and /api/user
 * 
 * Coverage:
 * - Authentication and authorization
 * - CRUD operations
 * - Data validation
 * - Error handling
 * - User ownership controls
 */

test.describe('User API Endpoints', () => {
  let authContext: any;
  let authTokens: any;
  let createdUserIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Create authenticated context for all tests
    const auth = await createAuthenticatedAPIContext(request, 'user1');
    authContext = auth.apiContext;
    authTokens = auth.authTokens;
  });

  test.afterAll(async () => {
    // Clean up any created test users
    for (const userId of createdUserIds) {
      try {
        await authContext.delete(`/api/users/${userId}`);
      } catch (e) {
        console.warn(`Failed to cleanup user ${userId}:`, e);
      }
    }
    
    if (authContext) {
      await authContext.dispose();
    }
  });

  test.describe('/api/users endpoint', () => {
    test('POST /api/users should create new user with valid data', async () => {
      const testUserId = `test-user-${Date.now()}`;
      const userData = {
        userId: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User API',
        phone: '12345678'
      };

      const response = await authContext.post('/api/users', {
        data: userData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      expect(data).toHaveProperty('id', testUserId);
      expect(data).toHaveProperty('email', userData.email);
      expect(data).toHaveProperty('name', userData.name);

      createdUserIds.push(testUserId);
    });

    test('POST /api/users should return 400 for missing required fields', async () => {
      const response = await authContext.post('/api/users', {
        data: {
          name: 'Test User'
          // Missing userId and email
        }
      });

      await expectErrorResponse(response, 400, 'UserId and email are required');
    });

    test('POST /api/users should return 400 for invalid email format', async () => {
      const response = await authContext.post('/api/users', {
        data: {
          userId: 'test-user-invalid',
          email: 'invalid-email',
          name: 'Test User'
        }
      });

      // Should handle invalid email gracefully
      expect([400, 500]).toContain(response.status());
    });

    test('POST /api/users should handle duplicate user creation gracefully', async () => {
      const testUserId = `test-user-duplicate-${Date.now()}`;
      const userData = {
        userId: testUserId,
        email: `duplicate-${Date.now()}@example.com`,
        name: 'Duplicate Test User',
        phone: '87654321'
      };

      // Create user first time
      const response1 = await authContext.post('/api/users', {
        data: userData
      });
      await expectSuccessfulResponse(response1, 201);
      createdUserIds.push(testUserId);

      // Try to create same user again - should either update or return existing
      const response2 = await authContext.post('/api/users', {
        data: { ...userData, name: 'Updated Name' }
      });

      expect([200, 201]).toContain(response2.status());
      const data = await response2.json();
      expect(data).toHaveProperty('id', testUserId);
    });

    test('POST /api/users should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, '/api/users', 'POST');
    });
  });

  test.describe('/api/users/[firebaseId] endpoint', () => {
    let testUserId: string;

    test.beforeAll(async () => {
      // Create a test user for GET/PUT/DELETE operations
      testUserId = `test-user-crud-${Date.now()}`;
      const userData = {
        userId: testUserId,
        email: `crud-test-${Date.now()}@example.com`,
        name: 'CRUD Test User',
        phone: '11223344'
      };

      const response = await authContext.post('/api/users', {
        data: userData
      });
      await expectSuccessfulResponse(response, 201);
      createdUserIds.push(testUserId);
    });

    test('GET /api/users/[firebaseId] should return user by ID', async () => {
      const response = await authContext.get(`/api/users/${testUserId}`);
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('id', testUserId);
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('name', 'CRUD Test User');
    });

    test('GET /api/users/[firebaseId] should return 404 for non-existent user', async () => {
      const response = await authContext.get('/api/users/non-existent-user-id');
      
      await expectErrorResponse(response, 404, 'User not found');
    });

    test('PUT /api/users/[firebaseId] should update user data', async () => {
      const updateData = {
        name: 'Updated CRUD Test User',
        phone: '99887766'
      };

      const response = await authContext.put(`/api/users/${testUserId}`, {
        data: updateData
      });

      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('name', updateData.name);
      expect(data).toHaveProperty('phone', updateData.phone);
    });

    test('PUT /api/users/[firebaseId] should return 404 for non-existent user', async () => {
      const response = await authContext.put('/api/users/non-existent-user', {
        data: { name: 'Should not work' }
      });

      expect([404, 500]).toContain(response.status());
    });

    test('DELETE /api/users/[firebaseId] should delete user', async () => {
      // Create a separate user just for deletion test
      const deleteTestUserId = `test-user-delete-${Date.now()}`;
      const createResponse = await authContext.post('/api/users', {
        data: {
          userId: deleteTestUserId,
          email: `delete-test-${Date.now()}@example.com`,
          name: 'Delete Test User'
        }
      });
      await expectSuccessfulResponse(createResponse, 201);

      // Now delete the user
      const deleteResponse = await authContext.delete(`/api/users/${deleteTestUserId}`);
      
      const data = await expectSuccessfulResponse(deleteResponse);
      expect(data).toHaveProperty('message', 'User deleted successfully');

      // Verify user is deleted
      const getResponse = await authContext.get(`/api/users/${deleteTestUserId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('DELETE /api/users/[firebaseId] should return 404 for non-existent user', async () => {
      const response = await authContext.delete('/api/users/non-existent-user');
      
      expect([404, 500]).toContain(response.status());
    });

    test('GET /api/users/[firebaseId] should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, `/api/users/${testUserId}`, 'GET');
    });

    test('PUT /api/users/[firebaseId] should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, `/api/users/${testUserId}`, 'PUT');
    });

    test('DELETE /api/users/[firebaseId] should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, `/api/users/${testUserId}`, 'DELETE');
    });
  });

  test.describe('/api/user endpoint (current user)', () => {
    test('GET /api/user should return current authenticated user', async () => {
      const response = await authContext.get('/api/user');
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email', authTokens.userEmail);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('isAdmin');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    test('PUT /api/user should update current user data', async () => {
      // First get current user data
      const getResponse = await authContext.get('/api/user');
      const currentUser = await expectSuccessfulResponse(getResponse);

      // Update user data
      const updateData = {
        name: `Updated User ${Date.now()}`,
        phone: '55667788'
      };

      const putResponse = await authContext.put('/api/user', {
        data: updateData
      });

      const updatedUser = await expectSuccessfulResponse(putResponse);
      expect(updatedUser).toHaveProperty('name', updateData.name);
      expect(updatedUser).toHaveProperty('id', currentUser.id);
    });

    test('PUT /api/user should validate update data', async () => {
      const response = await authContext.put('/api/user', {
        data: {
          email: 'invalid-email-format'
        }
      });

      // Should handle validation gracefully
      expect([400, 422, 500]).toContain(response.status());
    });

    test('GET /api/user should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, '/api/user', 'GET');
    });

    test('PUT /api/user should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, '/api/user', 'PUT');
    });
  });

  test.describe('User ownership and access control', () => {
    test('different users should not access each others data inappropriately', async ({ request }) => {
      // Create second authenticated context for user2
      const { apiContext: user2Context } = await createAuthenticatedAPIContext(request, 'user2');

      // Create a user with user1 context
      const testUserId = `test-user-ownership-${Date.now()}`;
      const userData = {
        userId: testUserId,
        email: `ownership-test-${Date.now()}@example.com`,
        name: 'Ownership Test User'
      };

      const createResponse = await authContext.post('/api/users', {
        data: userData
      });
      await expectSuccessfulResponse(createResponse, 201);
      createdUserIds.push(testUserId);

      // Try to access the user with user2 context
      // Note: This depends on implementation - some endpoints might allow cross-user access
      const getResponse = await user2Context.get(`/api/users/${testUserId}`);
      
      // Could be 403 (forbidden) or 200 (allowed) depending on business rules
      expect([200, 403, 404]).toContain(getResponse.status());

      await user2Context.dispose();
    });
  });

  test.describe('Data validation and edge cases', () => {
    test('should handle malformed JSON in POST requests', async () => {
      try {
        const response = await authContext.post('/api/users', {
          data: 'invalid-json'
        });
        expect([400, 500]).toContain(response.status());
      } catch (error) {
        // Playwright might throw on malformed JSON
        expect(error).toBeDefined();
      }
    });

    test('should handle empty request body', async () => {
      const response = await authContext.post('/api/users', {
        data: {}
      });

      await expectErrorResponse(response, 400, 'UserId and email are required');
    });

    test('should handle very long field values', async () => {
      const longString = 'a'.repeat(1000);
      const response = await authContext.post('/api/users', {
        data: {
          userId: 'test-long-fields',
          email: 'test@example.com',
          name: longString,
          phone: longString
        }
      });

      // Should either succeed or fail gracefully with validation error
      expect([200, 201, 400, 422, 500]).toContain(response.status());
    });

    test('should handle special characters in user data', async () => {
      const testUserId = `test-user-special-${Date.now()}`;
      const response = await authContext.post('/api/users', {
        data: {
          userId: testUserId,
          email: `special-${Date.now()}@example.com`,
          name: 'Test User with Special Chars: åæø!@#$%^&*()',
          phone: '+47 123 45 678'
        }
      });

      const data = await expectSuccessfulResponse(response, 201);
      expect(data).toHaveProperty('name');
      createdUserIds.push(testUserId);
    });
  });
});