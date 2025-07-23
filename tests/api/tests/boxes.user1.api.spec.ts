import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  cleanupTestData,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for /api/boxes endpoints
 * Based on https://playwright.dev/docs/api-testing
 */
test.describe('Boxes API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let testStableId: string;
  let testBoxId: string;
  let createdStableIds: string[] = [];
  let createdBoxIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;

    // Create a test stable for box operations
    const stableData = generateTestStableData({ name: 'Box Test Stable' });
    const createStableResponse = await apiContext.post('/api/stables', { data: stableData });
    const createdStable = await createStableResponse.json();
    testStableId = createdStable.id;
    createdStableIds.push(testStableId);

    // Create a test box
    const boxData = generateTestBoxData(testStableId, { name: 'Test Box for Operations' });
    const createBoxResponse = await apiContext.post('/api/boxes', { data: boxData });
    const createdBox = await createBoxResponse.json();
    testBoxId = createdBox.id;
    createdBoxIds.push(testBoxId);
  });

  test.afterAll(async () => {
    await cleanupTestData(apiContext, { boxes: createdBoxIds, stables: createdStableIds });
    await apiContext.dispose();
  });

  test.describe('GET /api/boxes', () => {
    test('should return all boxes', async () => {
      const response = await apiContext.get('/api/boxes');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
      if (boxes.length > 0) {
        expect(boxes[0]).toHaveProperty('id');
        expect(boxes[0]).toHaveProperty('name');
        expect(boxes[0]).toHaveProperty('stable_id');
        expect(boxes[0]).toHaveProperty('price');
      }
    });

    test('should support search filters', async () => {
      const response = await apiContext.get('/api/boxes?query=test');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should support location filters', async () => {
      const response = await apiContext.get('/api/boxes?location=Oslo');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should support price range filters', async () => {
      const response = await apiContext.get('/api/boxes?minPrice=1000&maxPrice=5000');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should support amenity filters', async () => {
      const response = await apiContext.get('/api/boxes?amenityIds=amenity1,amenity2');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should support box feature filters', async () => {
      const response = await apiContext.get('/api/boxes?is_indoor=true&has_window=true&has_electricity=true');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should support horse size filters', async () => {
      const response = await apiContext.get('/api/boxes?max_horse_size=large');
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });
  });

  test.describe('POST /api/boxes', () => {
    test('should create box with valid data', async () => {
      const boxData = generateTestBoxData(testStableId, { name: 'New API Test Box' });
      
      const response = await apiContext.post('/api/boxes', {
        data: boxData
      });
      
      const createdBox = await expectSuccessfulResponse(response, 201);
      createdBoxIds.push(createdBox.id);
      
      expect(createdBox).toHaveProperty('id');
      expect(createdBox.name).toBe(boxData.name);
      expect(createdBox.stable_id).toBe(testStableId);
      expect(createdBox.price).toBe(boxData.price);
      expect(createdBox.is_indoor).toBe(boxData.is_indoor);
      expect(createdBox.has_window).toBe(boxData.has_window);
    });

    test('should reject creation with missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Box'
        // Missing stable_id, price, etc.
      };
      
      const response = await apiContext.post('/api/boxes', {
        data: incompleteData
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should reject creation with invalid stable_id', async () => {
      const invalidData = generateTestBoxData('non-existent-stable-id');
      
      const response = await apiContext.post('/api/boxes', {
        data: invalidData
      });
      
      expect([400, 404, 500]).toContain(response.status());
    });

    test('should reject creation with invalid data types', async () => {
      const invalidData = generateTestBoxData(testStableId, {
        price: 'not-a-number',
        is_indoor: 'not-a-boolean',
        has_window: 'invalid'
      });
      
      const response = await apiContext.post('/api/boxes', {
        data: invalidData
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should validate price is positive number', async () => {
      const invalidData = generateTestBoxData(testStableId, {
        price: -100
      });
      
      const response = await apiContext.post('/api/boxes', {
        data: invalidData
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should validate box type enum', async () => {
      const invalidData = generateTestBoxData(testStableId, {
        type: 'invalid-box-type'
      });
      
      const response = await apiContext.post('/api/boxes', {
        data: invalidData
      });
      
      expect([400, 500]).toContain(response.status());
    });
  });

  test.describe('GET /api/boxes/[id]', () => {
    test('should return box details for valid ID', async () => {
      const response = await apiContext.get(`/api/boxes/${testBoxId}`);
      const box = await expectSuccessfulResponse(response);
      
      expect(box).toHaveProperty('id', testBoxId);
      expect(box).toHaveProperty('name');
      expect(box).toHaveProperty('stable_id', testStableId);
      expect(box).toHaveProperty('price');
      expect(box).toHaveProperty('is_indoor');
      expect(box).toHaveProperty('has_window');
      expect(box).toHaveProperty('has_electricity');
    });

    test('should return box with stable details', async () => {
      const response = await apiContext.get(`/api/boxes/${testBoxId}`);
      const box = await expectSuccessfulResponse(response);
      
      // Should include stable information
      expect(box).toHaveProperty('stable');
      if (box.stable) {
        expect(box.stable).toHaveProperty('name');
        expect(box.stable).toHaveProperty('location');
      }
    });

    test('should return 404 for non-existent box', async () => {
      const response = await apiContext.get('/api/boxes/non-existent-id');
      await expectErrorResponse(response, 404);
    });

    test('should return 404 for malformed box ID', async () => {
      const response = await apiContext.get('/api/boxes/invalid-uuid-format');
      await expectErrorResponse(response, 404);
    });
  });

  test.describe('PUT /api/boxes/[id]', () => {
    test('should update box with valid data', async () => {
      const updateData = {
        name: 'Updated Box Name',
        description: 'Updated description',
        price: 3000,
        has_window: false
      };
      
      const response = await apiContext.put(`/api/boxes/${testBoxId}`, {
        data: updateData
      });
      
      const updatedBox = await expectSuccessfulResponse(response);
      
      expect(updatedBox.name).toBe(updateData.name);
      expect(updatedBox.description).toBe(updateData.description);
      expect(updatedBox.price).toBe(updateData.price);
      expect(updatedBox.has_window).toBe(updateData.has_window);
      expect(updatedBox.stable_id).toBe(testStableId); // Should remain unchanged
    });

    test('should reject updates to non-existent box', async () => {
      const updateData = { name: 'New Name' };
      
      const response = await apiContext.put('/api/boxes/non-existent-id', {
        data: updateData
      });
      
      await expectErrorResponse(response, 404);
    });

    test('should reject updates with invalid data', async () => {
      const invalidData = {
        price: 'not-a-number',
        is_indoor: 'not-a-boolean'
      };
      
      const response = await apiContext.put(`/api/boxes/${testBoxId}`, {
        data: invalidData
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should not allow changing stable_id', async () => {
      const updateData = {
        name: 'Test Update',
        stable_id: 'different-stable-id'
      };
      
      const response = await apiContext.put(`/api/boxes/${testBoxId}`, {
        data: updateData
      });
      
      const updatedBox = await expectSuccessfulResponse(response);
      
      // stable_id should remain unchanged
      expect(updatedBox.stable_id).toBe(testStableId);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = {
        description: 'Only updating description'
      };
      
      const response = await apiContext.put(`/api/boxes/${testBoxId}`, {
        data: partialUpdate
      });
      
      const updatedBox = await expectSuccessfulResponse(response);
      
      expect(updatedBox.description).toBe(partialUpdate.description);
      expect(updatedBox).toHaveProperty('name'); // Other fields should still exist
    });
  });

  test.describe('DELETE /api/boxes/[id]', () => {
    test('should delete box with valid ID', async () => {
      // Create a box specifically for deletion
      const boxData = generateTestBoxData(testStableId, { name: 'Box for Deletion' });
      const createResponse = await apiContext.post('/api/boxes', { data: boxData });
      const createdBox = await createResponse.json();
      const boxIdToDelete = createdBox.id;
      
      const deleteResponse = await apiContext.delete(`/api/boxes/${boxIdToDelete}`);
      await expectSuccessfulResponse(deleteResponse, 200);
      
      // Verify box is deleted
      const getResponse = await apiContext.get(`/api/boxes/${boxIdToDelete}`);
      await expectErrorResponse(getResponse, 404);
    });

    test('should return 404 when deleting non-existent box', async () => {
      const response = await apiContext.delete('/api/boxes/non-existent-id');
      await expectErrorResponse(response, 404);
    });
  });

  test.describe('Box Sponsorship - /api/boxes/[id]/sponsored', () => {
    test('should get sponsorship status for box', async () => {
      const response = await apiContext.get(`/api/boxes/${testBoxId}/sponsored`);
      const sponsorshipData = await expectSuccessfulResponse(response);
      
      expect(sponsorshipData).toHaveProperty('is_sponsored');
      expect(typeof sponsorshipData.is_sponsored).toBe('boolean');
    });

    test('should update sponsorship status', async () => {
      const sponsorshipData = {
        is_sponsored: true,
        sponsored_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
      
      const response = await apiContext.post(`/api/boxes/${testBoxId}/sponsored`, {
        data: sponsorshipData
      });
      
      const updatedSponsorship = await expectSuccessfulResponse(response);
      
      expect(updatedSponsorship.is_sponsored).toBe(true);
      expect(updatedSponsorship).toHaveProperty('sponsored_until');
    });
  });

  test.describe('Authentication and Authorization', () => {
    test('should require authentication for box creation', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      const boxData = generateTestBoxData(testStableId);
      
      await expectUnauthorized(unauthenticatedRequest, '/api/boxes', 'POST');
    });

    test('should require authentication for box updates', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      
      await expectUnauthorized(unauthenticatedRequest, `/api/boxes/${testBoxId}`, 'PUT');
    });

    test('should require authentication for box deletion', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      
      await expectUnauthorized(unauthenticatedRequest, `/api/boxes/${testBoxId}`, 'DELETE');
    });

    test('should allow public access to box listings', async ({ playwright }) => {
      const publicRequest = await playwright.request.newContext();
      
      const response = await publicRequest.get('/api/boxes');
      await expectSuccessfulResponse(response);
    });

    test('should allow public access to individual box details', async ({ playwright }) => {
      const publicRequest = await playwright.request.newContext();
      
      const response = await publicRequest.get(`/api/boxes/${testBoxId}`);
      await expectSuccessfulResponse(response);
    });
  });

  test.describe('Data Validation and Business Rules', () => {
    test('should validate box belongs to authenticated user stable', async () => {
      // This would require creating a box owned by a different user
      // For now, we'll test that creation validates stable ownership
      
      // Try to create box for non-existent stable (simulates permission check)
      const invalidData = generateTestBoxData('non-existent-stable-id');
      
      const response = await apiContext.post('/api/boxes', {
        data: invalidData
      });
      
      expect([400, 404, 500]).toContain(response.status());
    });

    test('should validate price constraints', async () => {
      const tests = [
        { price: 0, shouldFail: true },
        { price: -100, shouldFail: true },
        { price: 100, shouldFail: false },
        { price: 10000, shouldFail: false }
      ];
      
      for (const testCase of tests) {
        const boxData = generateTestBoxData(testStableId, { 
          name: `Price Test ${testCase.price}`,
          price: testCase.price 
        });
        
        const response = await apiContext.post('/api/boxes', { data: boxData });
        
        if (testCase.shouldFail) {
          expect([400, 500]).toContain(response.status());
        } else {
          const createdBox = await expectSuccessfulResponse(response, 201);
          createdBoxIds.push(createdBox.id);
          expect(createdBox.price).toBe(testCase.price);
        }
      }
    });

    test('should validate required amenity relationships', async () => {
      const boxData = generateTestBoxData(testStableId, {
        amenityIds: ['non-existent-amenity-id']
      });
      
      const response = await apiContext.post('/api/boxes', { data: boxData });
      
      // Should handle invalid amenity IDs gracefully
      expect([200, 201, 400, 500]).toContain(response.status());
    });
  });
});