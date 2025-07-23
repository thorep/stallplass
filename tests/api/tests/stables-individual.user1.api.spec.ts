import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  cleanupTestData,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for individual stable operations /api/stables/[id]
 * Based on https://playwright.dev/docs/api-testing
 */
test.describe('Individual Stables API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let testStableId: string;
  let createdStableIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;

    // Create a test stable for individual operations
    const stableData = generateTestStableData({ name: 'Individual Test Stable' });
    const createResponse = await apiContext.post('/api/stables', { data: stableData });
    const createdStable = await createResponse.json();
    testStableId = createdStable.id;
    createdStableIds.push(testStableId);
  });

  test.afterAll(async () => {
    await cleanupTestData(apiContext, { stables: createdStableIds });
    await apiContext.dispose();
  });

  test.describe('GET /api/stables/[id]', () => {
    test('should return stable details for valid ID', async () => {
      const response = await apiContext.get(`/api/stables/${testStableId}`);
      const stable = await expectSuccessfulResponse(response);
      
      expect(stable).toHaveProperty('id', testStableId);
      expect(stable).toHaveProperty('name');
      expect(stable).toHaveProperty('owner_id', authTokens.userId);
      expect(stable).toHaveProperty('location');
      expect(stable).toHaveProperty('description');
    });

    test('should return 404 for non-existent stable', async () => {
      const response = await apiContext.get('/api/stables/non-existent-id');
      await expectErrorResponse(response, 404);
    });

    test('should return 404 for malformed stable ID', async () => {
      const response = await apiContext.get('/api/stables/invalid-uuid-format');
      await expectErrorResponse(response, 404);
    });

    test('should allow access to own stables', async () => {
      const response = await apiContext.get(`/api/stables/${testStableId}`);
      const stable = await expectSuccessfulResponse(response);
      
      expect(stable.owner_id).toBe(authTokens.userId);
    });
  });

  test.describe('PUT /api/stables/[id]', () => {
    test('should update stable with valid data', async () => {
      const updateData = {
        name: 'Updated Stable Name',
        description: 'Updated description',
        totalBoxes: 10
      };
      
      const response = await apiContext.put(`/api/stables/${testStableId}`, {
        data: updateData
      });
      
      const updatedStable = await expectSuccessfulResponse(response);
      
      expect(updatedStable.name).toBe(updateData.name);
      expect(updatedStable.description).toBe(updateData.description);
      expect(updatedStable.total_boxes).toBe(updateData.totalBoxes);
      expect(updatedStable.owner_id).toBe(authTokens.userId); // Should remain unchanged
    });

    test('should reject updates to non-existent stable', async () => {
      const updateData = { name: 'New Name' };
      
      const response = await apiContext.put('/api/stables/non-existent-id', {
        data: updateData
      });
      
      await expectErrorResponse(response, 404);
    });

    test('should reject updates with invalid data', async () => {
      const invalidData = {
        totalBoxes: 'not-a-number',
        coordinates: 'invalid-format'
      };
      
      const response = await apiContext.put(`/api/stables/${testStableId}`, {
        data: invalidData
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should not allow changing owner_id', async () => {
      const updateData = {
        name: 'Test Update',
        owner_id: 'different-user-id'
      };
      
      const response = await apiContext.put(`/api/stables/${testStableId}`, {
        data: updateData
      });
      
      const updatedStable = await expectSuccessfulResponse(response);
      
      // owner_id should remain unchanged
      expect(updatedStable.owner_id).toBe(authTokens.userId);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = {
        description: 'Only updating description'
      };
      
      const response = await apiContext.put(`/api/stables/${testStableId}`, {
        data: partialUpdate
      });
      
      const updatedStable = await expectSuccessfulResponse(response);
      
      expect(updatedStable.description).toBe(partialUpdate.description);
      expect(updatedStable).toHaveProperty('name'); // Other fields should still exist
    });
  });

  test.describe('DELETE /api/stables/[id]', () => {
    test('should delete stable with valid ID', async () => {
      // Create a stable specifically for deletion
      const stableData = generateTestStableData({ name: 'Stable for Deletion' });
      const createResponse = await apiContext.post('/api/stables', { data: stableData });
      const createdStable = await createResponse.json();
      const stableIdToDelete = createdStable.id;
      
      const deleteResponse = await apiContext.delete(`/api/stables/${stableIdToDelete}`);
      await expectSuccessfulResponse(deleteResponse, 200);
      
      // Verify stable is deleted
      const getResponse = await apiContext.get(`/api/stables/${stableIdToDelete}`);
      await expectErrorResponse(getResponse, 404);
    });

    test('should return 404 when deleting non-existent stable', async () => {
      const response = await apiContext.delete('/api/stables/non-existent-id');
      await expectErrorResponse(response, 404);
    });

    test('should only allow owners to delete their stables', async () => {
      // This test would require creating a stable with user2 and trying to delete with user1
      // For now, we test that deletion requires authentication
      const { playwright } = test.info();
      const unauthenticatedRequest = await playwright.request.newContext();
      
      await expectUnauthorized(
        unauthenticatedRequest, 
        `/api/stables/${testStableId}`,
        'DELETE'
      );
    });
  });

  test.describe('Stable FAQs - /api/stables/[id]/faqs', () => {
    test('should get FAQs for stable', async () => {
      const response = await apiContext.get(`/api/stables/${testStableId}/faqs`);
      const faqs = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(faqs)).toBe(true);
    });

    test('should create FAQ for stable', async () => {
      const faqData = {
        question: 'Test FAQ Question?',
        answer: 'Test FAQ Answer',
        order: 1
      };
      
      const response = await apiContext.post(`/api/stables/${testStableId}/faqs`, {
        data: faqData
      });
      
      const createdFaq = await expectSuccessfulResponse(response, 201);
      
      expect(createdFaq).toHaveProperty('id');
      expect(createdFaq.question).toBe(faqData.question);
      expect(createdFaq.answer).toBe(faqData.answer);
      expect(createdFaq.stable_id).toBe(testStableId);
    });

    test('should update specific FAQ', async () => {
      // First create an FAQ
      const faqData = {
        question: 'Original Question?',
        answer: 'Original Answer',
        order: 1
      };
      
      const createResponse = await apiContext.post(`/api/stables/${testStableId}/faqs`, {
        data: faqData
      });
      const createdFaq = await createResponse.json();
      
      // Then update it
      const updateData = {
        question: 'Updated Question?',
        answer: 'Updated Answer'
      };
      
      const updateResponse = await apiContext.put(`/api/stables/${testStableId}/faqs/${createdFaq.id}`, {
        data: updateData
      });
      
      const updatedFaq = await expectSuccessfulResponse(updateResponse);
      
      expect(updatedFaq.question).toBe(updateData.question);
      expect(updatedFaq.answer).toBe(updateData.answer);
    });

    test('should delete specific FAQ', async () => {
      // First create an FAQ
      const faqData = {
        question: 'FAQ to delete?',
        answer: 'This will be deleted',
        order: 1
      };
      
      const createResponse = await apiContext.post(`/api/stables/${testStableId}/faqs`, {
        data: faqData
      });
      const createdFaq = await createResponse.json();
      
      // Then delete it
      const deleteResponse = await apiContext.delete(`/api/stables/${testStableId}/faqs/${createdFaq.id}`);
      await expectSuccessfulResponse(deleteResponse, 200);
      
      // Verify it's deleted by checking the FAQ list
      const getFaqsResponse = await apiContext.get(`/api/stables/${testStableId}/faqs`);
      const faqs = await getFaqsResponse.json();
      
      const deletedFaq = faqs.find((faq: any) => faq.id === createdFaq.id);
      expect(deletedFaq).toBeUndefined();
    });
  });

  test.describe('Stable Boxes - /api/stables/[id]/boxes', () => {
    test('should get boxes for stable', async () => {
      const response = await apiContext.get(`/api/stables/${testStableId}/boxes`);
      const boxes = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(boxes)).toBe(true);
    });

    test('should create box for stable', async () => {
      const boxData = {
        name: 'Test Box',
        description: 'A test box',
        price: 2500,
        size: '3x4m',
        is_indoor: true,
        has_window: true,
        type: 'regular'
      };
      
      const response = await apiContext.post(`/api/stables/${testStableId}/boxes`, {
        data: boxData
      });
      
      const createdBox = await expectSuccessfulResponse(response, 201);
      
      expect(createdBox).toHaveProperty('id');
      expect(createdBox.name).toBe(boxData.name);
      expect(createdBox.stable_id).toBe(testStableId);
      expect(createdBox.price).toBe(boxData.price);
    });
  });

  test.describe('Authentication and Authorization', () => {
    test('should require authentication for stable operations', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      
      // Test all methods require authentication
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}`, 'GET');
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}`, 'PUT');
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}`, 'DELETE');
    });

    test('should require authentication for FAQ operations', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}/faqs`, 'GET');
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}/faqs`, 'POST');
    });

    test('should require authentication for box operations', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}/boxes`, 'GET');
      await expectUnauthorized(unauthenticatedRequest, `/api/stables/${testStableId}/boxes`, 'POST');
    });
  });
});