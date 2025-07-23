import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestAmenityData,
  addAuthHeaders,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for amenity endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Tests amenity CRUD operations for both stable and box amenities
 * Focuses on categorization, Norwegian data handling, and proper authorization
 */
test.describe('Amenities API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let createdStableAmenityIds: string[] = [];
  let createdBoxAmenityIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    for (const id of createdStableAmenityIds) {
      try {
        await apiContext.delete(`/api/stable-amenities/${id}`, {
          headers: addAuthHeaders(authTokens)
        });
      } catch (e) {
        console.warn(`Failed to cleanup stable amenity ${id}:`, e);
      }
    }
    
    for (const id of createdBoxAmenityIds) {
      try {
        await apiContext.delete(`/api/box-amenities/${id}`, {
          headers: addAuthHeaders(authTokens)
        });
      } catch (e) {
        console.warn(`Failed to cleanup box amenity ${id}:`, e);
      }
    }
    
    await apiContext.dispose();
  });

  test.describe('GET /api/amenities (deprecated endpoint)', () => {
    test('should return 410 Gone with deprecation message', async () => {
      const response = await apiContext.get('/api/amenities');
      
      await expectErrorResponse(response, 410, 'deprecated');
      const data = await response.json();
      expect(data.error).toContain('/api/stable-amenities or /api/box-amenities');
    });

    test('should return 410 Gone even with authentication', async () => {
      const response = await apiContext.get('/api/amenities', {
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 410, 'deprecated');
    });
  });

  test.describe('GET /api/stable-amenities', () => {
    test('should fetch all stable amenities without authentication', async () => {
      const response = await apiContext.get('/api/stable-amenities');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // Each amenity should have required fields
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
        expect(typeof data[0].name).toBe('string');
      }
    });

    test('should return stable amenities sorted by name', async () => {
      const response = await apiContext.get('/api/stable-amenities');
      const data = await expectSuccessfulResponse(response);
      
      if (data.length > 1) {
        // Check if sorted alphabetically
        for (let i = 1; i < data.length; i++) {
          expect(data[i-1].name.localeCompare(data[i].name, 'no')).toBeLessThanOrEqual(0);
        }
      }
    });

    test('should handle Norwegian characters in amenity names', async () => {
      const response = await apiContext.get('/api/stable-amenities');
      const data = await expectSuccessfulResponse(response);
      
      // Look for amenities with Norwegian characters
      const norwegianAmenities = data.filter((amenity: any) => 
        /[æøåÆØÅ]/.test(amenity.name)
      );
      
      // If Norwegian amenities exist, verify they're properly handled
      norwegianAmenities.forEach((amenity: any) => {
        expect(typeof amenity.name).toBe('string');
        expect(amenity.name.length).toBeGreaterThan(0);
      });
    });

    test('should return consistent response structure', async () => {
      const response = await apiContext.get('/api/stable-amenities');
      const data = await expectSuccessfulResponse(response);
      
      expect(response.headers()['content-type']).toContain('application/json');
      
      if (data.length > 0) {
        const amenity = data[0];
        expect(amenity).toHaveProperty('id');
        expect(amenity).toHaveProperty('name');
        expect(typeof amenity.id).toBe('string');
        expect(typeof amenity.name).toBe('string');
      }
    });
  });

  test.describe('GET /api/box-amenities', () => {
    test('should fetch all box amenities without authentication', async () => {
      const response = await apiContext.get('/api/box-amenities');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // Each amenity should have required fields
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
        expect(typeof data[0].name).toBe('string');
      }
    });

    test('should return box amenities sorted by name', async () => {
      const response = await apiContext.get('/api/box-amenities');
      const data = await expectSuccessfulResponse(response);
      
      if (data.length > 1) {
        // Check if sorted alphabetically with Norwegian collation
        for (let i = 1; i < data.length; i++) {
          expect(data[i-1].name.localeCompare(data[i].name, 'no')).toBeLessThanOrEqual(0);
        }
      }
    });

    test('should handle Norwegian characters in box amenity names', async () => {
      const response = await apiContext.get('/api/box-amenities');
      const data = await expectSuccessfulResponse(response);
      
      // Look for amenities with Norwegian characters
      const norwegianAmenities = data.filter((amenity: any) => 
        /[æøåÆØÅ]/.test(amenity.name)
      );
      
      // If Norwegian amenities exist, verify they're properly handled
      norwegianAmenities.forEach((amenity: any) => {
        expect(typeof amenity.name).toBe('string');
        expect(amenity.name.length).toBeGreaterThan(0);
      });
    });

    test('should differentiate box amenities from stable amenities', async () => {
      const stableResponse = await apiContext.get('/api/stable-amenities');
      const stableData = await expectSuccessfulResponse(stableResponse);
      
      const boxResponse = await apiContext.get('/api/box-amenities');
      const boxData = await expectSuccessfulResponse(boxResponse);
      
      // Amenities should be properly categorized (no overlap in IDs)
      const stableIds = stableData.map((a: any) => a.id);
      const boxIds = boxData.map((a: any) => a.id);
      
      const intersection = stableIds.filter((id: string) => boxIds.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  test.describe('POST /api/stable-amenities', () => {
    test('should reject unauthorized requests', async () => {
      await expectUnauthorized(apiContext, '/api/stable-amenities', 'POST');
    });

    test('should create stable amenity with authentication', async () => {
      const amenityData = generateTestAmenityData('stable', {
        name: 'Test Stall Amenity with æøå'
      });

      const response = await apiContext.post('/api/stable-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(amenityData.name);
      expect(typeof data.id).toBe('string');
      
      createdStableAmenityIds.push(data.id);
    });

    test('should handle Norwegian characters in stable amenity creation', async () => {
      const amenityData = generateTestAmenityData('stable', {
        name: 'Stall med særlige fasiliteter for hæster'
      });

      const response = await apiContext.post('/api/stable-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data.name).toBe(amenityData.name);
      expect(data.name).toContain('særlige');
      expect(data.name).toContain('hæster');
      
      createdStableAmenityIds.push(data.id);
    });

    test('should validate required fields for stable amenity', async () => {
      const response = await apiContext.post('/api/stable-amenities', {
        data: {},
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400, 'name');
    });

    test('should reject duplicate stable amenity names', async () => {
      const amenityData = generateTestAmenityData('stable', {
        name: 'Unique Stable Amenity Test'
      });

      // Create first amenity
      const firstResponse = await apiContext.post('/api/stable-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });
      const firstData = await expectSuccessfulResponse(firstResponse, 201);
      createdStableAmenityIds.push(firstData.id);

      // Try to create duplicate
      const duplicateResponse = await apiContext.post('/api/stable-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(duplicateResponse, 409, 'already exists');
    });
  });

  test.describe('POST /api/box-amenities', () => {
    test('should reject unauthorized requests', async () => {
      await expectUnauthorized(apiContext, '/api/box-amenities', 'POST');
    });

    test('should create box amenity with authentication', async () => {
      const amenityData = generateTestAmenityData('box', {
        name: 'Test Box Amenity with æøå'
      });

      const response = await apiContext.post('/api/box-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(amenityData.name);
      expect(typeof data.id).toBe('string');
      
      createdBoxAmenityIds.push(data.id);
    });

    test('should handle Norwegian characters in box amenity creation', async () => {
      const amenityData = generateTestAmenityData('box', {
        name: 'Bås med spesielle løsninger for større hester'
      });

      const response = await apiContext.post('/api/box-amenities', {
        data: amenityData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data.name).toBe(amenityData.name);
      expect(data.name).toContain('løsninger');
      expect(data.name).toContain('større');
      
      createdBoxAmenityIds.push(data.id);
    });

    test('should validate required fields for box amenity', async () => {
      const response = await apiContext.post('/api/box-amenities', {
        data: {},
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400, 'name');
    });

    test('should allow same name for box and stable amenities (different categories)', async () => {
      const amenityName = 'Cross-Category Amenity Test';
      
      // Create stable amenity
      const stableResponse = await apiContext.post('/api/stable-amenities', {
        data: { name: amenityName },
        headers: addAuthHeaders(authTokens)
      });
      const stableData = await expectSuccessfulResponse(stableResponse, 201);
      createdStableAmenityIds.push(stableData.id);

      // Create box amenity with same name (should succeed)
      const boxResponse = await apiContext.post('/api/box-amenities', {
        data: { name: amenityName },
        headers: addAuthHeaders(authTokens)
      });
      const boxData = await expectSuccessfulResponse(boxResponse, 201);
      createdBoxAmenityIds.push(boxData.id);

      // Verify they have different IDs
      expect(stableData.id).not.toBe(boxData.id);
    });
  });

  test.describe('Amenity Categorization Tests', () => {
    test('should maintain proper separation between stable and box amenities', async () => {
      // Create one of each type
      const stableAmenity = generateTestAmenityData('stable', {
        name: 'Categorization Test Stable'
      });
      const boxAmenity = generateTestAmenityData('box', {
        name: 'Categorization Test Box'
      });

      const stableResponse = await apiContext.post('/api/stable-amenities', {
        data: stableAmenity,
        headers: addAuthHeaders(authTokens)
      });
      const stableData = await expectSuccessfulResponse(stableResponse, 201);
      createdStableAmenityIds.push(stableData.id);

      const boxResponse = await apiContext.post('/api/box-amenities', {
        data: boxAmenity,
        headers: addAuthHeaders(authTokens)
      });
      const boxData = await expectSuccessfulResponse(boxResponse, 201);
      createdBoxAmenityIds.push(boxData.id);

      // Verify they appear in correct lists only
      const stableListResponse = await apiContext.get('/api/stable-amenities');
      const stableList = await expectSuccessfulResponse(stableListResponse);
      
      const boxListResponse = await apiContext.get('/api/box-amenities');
      const boxList = await expectSuccessfulResponse(boxListResponse);

      // Stable amenity should be in stable list only
      expect(stableList.some((a: any) => a.id === stableData.id)).toBe(true);
      expect(boxList.some((a: any) => a.id === stableData.id)).toBe(false);

      // Box amenity should be in box list only
      expect(boxList.some((a: any) => a.id === boxData.id)).toBe(true);
      expect(stableList.some((a: any) => a.id === boxData.id)).toBe(false);
    });

    test('should handle bulk amenity fetching consistently', async () => {
      // Fetch both types multiple times to ensure consistency
      const requests = await Promise.all([
        apiContext.get('/api/stable-amenities'),
        apiContext.get('/api/box-amenities'),
        apiContext.get('/api/stable-amenities'),
        apiContext.get('/api/box-amenities')
      ]);

      const responses = await Promise.all(
        requests.map(async (r) => await expectSuccessfulResponse(r))
      );

      // Results should be consistent
      expect(responses[0]).toEqual(responses[2]);
      expect(responses[1]).toEqual(responses[3]);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in POST requests', async () => {
      const response = await apiContext.post('/api/stable-amenities', {
        data: 'invalid json',
        headers: addAuthHeaders(authTokens)
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle extremely long amenity names', async () => {
      const longName = 'A'.repeat(1000);
      
      const response = await apiContext.post('/api/stable-amenities', {
        data: { name: longName },
        headers: addAuthHeaders(authTokens)
      });

      // Should either accept it or return a validation error
      if (response.status() === 201) {
        const data = await response.json();
        createdStableAmenityIds.push(data.id);
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should handle special characters and HTML in amenity names', async () => {
      const specialName = '<script>alert("test")</script> & "quotes" \' apostrophes';
      
      const response = await apiContext.post('/api/stable-amenities', {
        data: { name: specialName },
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 201) {
        const data = await expectSuccessfulResponse(response, 201);
        expect(data.name).toBe(specialName); // Should preserve original
        createdStableAmenityIds.push(data.id);
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    test('should handle concurrent amenity creation', async () => {
      const amenityData1 = generateTestAmenityData('stable', { name: 'Concurrent Test 1' });
      const amenityData2 = generateTestAmenityData('box', { name: 'Concurrent Test 2' });

      const [response1, response2] = await Promise.all([
        apiContext.post('/api/stable-amenities', {
          data: amenityData1,
          headers: addAuthHeaders(authTokens)
        }),
        apiContext.post('/api/box-amenities', {
          data: amenityData2,
          headers: addAuthHeaders(authTokens)
        })
      ]);

      const data1 = await expectSuccessfulResponse(response1, 201);
      const data2 = await expectSuccessfulResponse(response2, 201);

      expect(data1.id).not.toBe(data2.id);
      
      createdStableAmenityIds.push(data1.id);
      createdBoxAmenityIds.push(data2.id);
    });

    test('should return proper error for non-existent endpoints', async () => {
      const response = await apiContext.get('/api/stable-amenities/nonexistent');
      expect(response.status()).toBe(404);
    });
  });
});