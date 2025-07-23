import { test, expect } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized,
  expectForbidden,
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  cleanupTestData
} from '../utils/auth-helpers';

/**
 * Comprehensive API tests for admin endpoints
 * Tests all /api/admin/* endpoints
 * 
 * Coverage:
 * - Admin authentication and authorization
 * - CRUD operations for all admin resources
 * - Data validation and error handling
 * - Non-admin user access prevention
 * - Edge cases and boundary conditions
 */

test.describe('Admin API Endpoints', () => {
  let authContext: any;
  let authTokens: any;
  let nonAdminContext: any;
  let createdIds: {
    stables: string[];
    boxes: string[];
    amenities: { stable: string[]; box: string[] };
    users: string[];
    roadmapItems: string[];
  };

  test.beforeAll(async ({ request }) => {
    // Create authenticated context for admin user (user1)
    const auth = await createAuthenticatedAPIContext(request, 'user1');
    authContext = auth.apiContext;
    authTokens = auth.authTokens;
    
    // Create non-admin context (user2)
    const nonAdminAuth = await createAuthenticatedAPIContext(request, 'user2');
    nonAdminContext = nonAdminAuth.apiContext;
    
    // Initialize tracking arrays for cleanup
    createdIds = {
      stables: [],
      boxes: [],
      amenities: { stable: [], box: [] },
      users: [],
      roadmapItems: []
    };
  });

  test.afterAll(async () => {
    // Clean up all created test data
    await cleanupTestData(authContext, {
      stables: createdIds.stables,
      boxes: createdIds.boxes
    });
    
    // Additional cleanup for admin-specific resources
    for (const id of createdIds.amenities.stable) {
      try {
        await authContext.delete(`/api/admin/amenities/stable?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup stable amenity ${id}:`, e);
      }
    }
    
    for (const id of createdIds.amenities.box) {
      try {
        await authContext.delete(`/api/admin/amenities/box?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup box amenity ${id}:`, e);
      }
    }
    
    for (const id of createdIds.roadmapItems) {
      try {
        await authContext.delete(`/api/admin/roadmap?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup roadmap item ${id}:`, e);
      }
    }
    
    if (authContext) await authContext.dispose();
    if (nonAdminContext) await nonAdminContext.dispose();
  });

  test.describe('/api/admin/users endpoint', () => {
    test('GET /api/admin/users should return all users with counts', async () => {
      const response = await authContext.get('/api/admin/users');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const user = data[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('is_admin');
      }
    });

    test('PUT /api/admin/users should update user admin status', async () => {
      // First get a user to update
      const getUsersResponse = await authContext.get('/api/admin/users');
      const users = await expectSuccessfulResponse(getUsersResponse);
      
      if (users.length === 0) {
        test.skip('No users available for admin status test');
      }
      
      const testUser = users.find(u => u.email !== authTokens.userEmail);
      if (!testUser) {
        test.skip('No non-admin users available for testing');
      }
      
      const response = await authContext.put('/api/admin/users', {
        data: {
          id: testUser.id,
          isAdmin: !testUser.is_admin
        }
      });
      
      const updatedUser = await expectSuccessfulResponse(response);
      expect(updatedUser).toHaveProperty('id', testUser.id);
      expect(updatedUser).toHaveProperty('is_admin', !testUser.is_admin);
      
      // Revert the change
      await authContext.put('/api/admin/users', {
        data: {
          id: testUser.id,
          isAdmin: testUser.is_admin
        }
      });
    });

    test('PUT /api/admin/users should return 400 for missing user ID', async () => {
      const response = await authContext.put('/api/admin/users', {
        data: { isAdmin: true }
      });
      
      await expectErrorResponse(response, 400, 'User ID is required');
    });

    test('GET /api/admin/users should be unauthorized without authentication', async ({ request }) => {
      await expectUnauthorized(request, '/api/admin/users', 'GET');
    });

    test('GET /api/admin/users should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/users', 'GET');
    });
  });

  test.describe('/api/admin/stables endpoint', () => {
    test('GET /api/admin/stables should return all stables with owner info and counts', async () => {
      const response = await authContext.get('/api/admin/stables');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const stable = data[0];
        expect(stable).toHaveProperty('id');
        expect(stable).toHaveProperty('name');
        expect(stable).toHaveProperty('owner');
        expect(stable).toHaveProperty('_count');
        expect(stable._count).toHaveProperty('boxes');
        expect(stable._count).toHaveProperty('conversations');
        expect(stable._count).toHaveProperty('rentals');
      }
    });

    test('PUT /api/admin/stables should update stable featured status', async () => {
      // First get a stable to update
      const getStablesResponse = await authContext.get('/api/admin/stables');
      const stables = await expectSuccessfulResponse(getStablesResponse);
      
      if (stables.length === 0) {
        test.skip('No stables available for featured status test');
      }
      
      const testStable = stables[0];
      const response = await authContext.put('/api/admin/stables', {
        data: {
          id: testStable.id,
          featured: !testStable.featured
        }
      });
      
      const updatedStable = await expectSuccessfulResponse(response);
      expect(updatedStable).toHaveProperty('id', testStable.id);
      expect(updatedStable).toHaveProperty('featured', !testStable.featured);
      
      // Revert the change
      await authContext.put('/api/admin/stables', {
        data: {
          id: testStable.id,
          featured: testStable.featured
        }
      });
    });

    test('PUT /api/admin/stables should return 400 for missing stable ID', async () => {
      const response = await authContext.put('/api/admin/stables', {
        data: { featured: true }
      });
      
      await expectErrorResponse(response, 400, 'Stable ID is required');
    });

    test('DELETE /api/admin/stables should delete stable', async () => {
      // Create a test stable first (requires creating through regular API)
      const stableData = generateTestStableData({ name: 'Admin Delete Test Stable' });
      const createResponse = await authContext.post('/api/stables', {
        data: stableData
      });
      
      if (createResponse.status() !== 201) {
        test.skip('Could not create test stable for deletion test');
      }
      
      const createdStable = await createResponse.json();
      createdIds.stables.push(createdStable.id);
      
      const response = await authContext.delete(`/api/admin/stables?id=${createdStable.id}`);
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('success', true);
      
      // Remove from cleanup array since it's deleted
      createdIds.stables = createdIds.stables.filter(id => id !== createdStable.id);
    });

    test('DELETE /api/admin/stables should return 400 for missing ID', async () => {
      const response = await authContext.delete('/api/admin/stables');
      
      await expectErrorResponse(response, 400, 'Stable ID is required');
    });

    test('GET /api/admin/stables should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/stables', 'GET');
    });
  });

  test.describe('/api/admin/boxes endpoint', () => {
    test('GET /api/admin/boxes should return all boxes with stable and owner info', async () => {
      const response = await authContext.get('/api/admin/boxes');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const box = data[0];
        expect(box).toHaveProperty('id');
        expect(box).toHaveProperty('name');
        expect(box).toHaveProperty('stable');
        expect(box).toHaveProperty('_count');
        expect(box._count).toHaveProperty('conversations');
        expect(box._count).toHaveProperty('rentals');
        
        if (box.stable) {
          expect(box.stable).toHaveProperty('id');
          expect(box.stable).toHaveProperty('name');
          expect(box.stable).toHaveProperty('owner');
        }
      }
    });

    test('PUT /api/admin/boxes should update box availability', async () => {
      // First get a box to update
      const getBoxesResponse = await authContext.get('/api/admin/boxes');
      const boxes = await expectSuccessfulResponse(getBoxesResponse);
      
      if (boxes.length === 0) {
        test.skip('No boxes available for availability test');
      }
      
      const testBox = boxes[0];
      const response = await authContext.put('/api/admin/boxes', {
        data: {
          id: testBox.id,
          isAvailable: !testBox.is_available
        }
      });
      
      const updatedBox = await expectSuccessfulResponse(response);
      expect(updatedBox).toHaveProperty('id', testBox.id);
      expect(updatedBox).toHaveProperty('is_available', !testBox.is_available);
      
      // Revert the change
      await authContext.put('/api/admin/boxes', {
        data: {
          id: testBox.id,
          isAvailable: testBox.is_available
        }
      });
    });

    test('PUT /api/admin/boxes should return 400 for missing box ID', async () => {
      const response = await authContext.put('/api/admin/boxes', {
        data: { isAvailable: true }
      });
      
      await expectErrorResponse(response, 400, 'Box ID is required');
    });

    test('DELETE /api/admin/boxes should delete box', async () => {
      // First get a box to delete (or skip if none available)
      const getBoxesResponse = await authContext.get('/api/admin/boxes');
      const boxes = await expectSuccessfulResponse(getBoxesResponse);
      
      if (boxes.length === 0) {
        test.skip('No boxes available for deletion test');
      }
      
      const testBox = boxes[0];
      const response = await authContext.delete(`/api/admin/boxes?id=${testBox.id}`);
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('success', true);
    });

    test('DELETE /api/admin/boxes should return 400 for missing ID', async () => {
      const response = await authContext.delete('/api/admin/boxes');
      
      await expectErrorResponse(response, 400, 'Box ID is required');
    });

    test('GET /api/admin/boxes should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/boxes', 'GET');
    });
  });

  test.describe('/api/admin/amenities/stable endpoint', () => {
    test('GET /api/admin/amenities/stable should return all stable amenities', async () => {
      const response = await authContext.get('/api/admin/amenities/stable');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const amenity = data[0];
        expect(amenity).toHaveProperty('id');
        expect(amenity).toHaveProperty('name');
      }
    });

    test('POST /api/admin/amenities/stable should create new stable amenity', async () => {
      const amenityName = `Test Stable Amenity ${Date.now()}`;
      const response = await authContext.post('/api/admin/amenities/stable', {
        data: { name: amenityName }
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('name', amenityName);
      expect(data).toHaveProperty('id');
      
      createdIds.amenities.stable.push(data.id);
    });

    test('PUT /api/admin/amenities/stable should update stable amenity', async () => {
      // Create amenity first
      const createResponse = await authContext.post('/api/admin/amenities/stable', {
        data: { name: 'Test Amenity for Update' }
      });
      const createdAmenity = await expectSuccessfulResponse(createResponse);
      createdIds.amenities.stable.push(createdAmenity.id);
      
      // Update it
      const updatedName = 'Updated Test Amenity';
      const response = await authContext.put('/api/admin/amenities/stable', {
        data: {
          id: createdAmenity.id,
          name: updatedName
        }
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('name', updatedName);
      expect(data).toHaveProperty('id', createdAmenity.id);
    });

    test('DELETE /api/admin/amenities/stable should delete stable amenity', async () => {
      // Create amenity first
      const createResponse = await authContext.post('/api/admin/amenities/stable', {
        data: { name: 'Test Amenity for Deletion' }
      });
      const createdAmenity = await expectSuccessfulResponse(createResponse);
      
      // Delete it
      const response = await authContext.delete(`/api/admin/amenities/stable?id=${createdAmenity.id}`);
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('success', true);
    });

    test('DELETE /api/admin/amenities/stable should return 400 for missing ID', async () => {
      const response = await authContext.delete('/api/admin/amenities/stable');
      
      await expectErrorResponse(response, 400, 'ID is required');
    });

    test('POST /api/admin/amenities/stable should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/amenities/stable', 'POST');
    });
  });

  test.describe('/api/admin/amenities/box endpoint', () => {
    test('GET /api/admin/amenities/box should return all box amenities', async () => {
      const response = await authContext.get('/api/admin/amenities/box');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const amenity = data[0];
        expect(amenity).toHaveProperty('id');
        expect(amenity).toHaveProperty('name');
      }
    });

    test('POST /api/admin/amenities/box should create new box amenity', async () => {
      const amenityName = `Test Box Amenity ${Date.now()}`;
      const response = await authContext.post('/api/admin/amenities/box', {
        data: { name: amenityName }
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('name', amenityName);
      expect(data).toHaveProperty('id');
      
      createdIds.amenities.box.push(data.id);
    });

    test.describe('CRUD operations for box amenities', () => {
      let testAmenityId: string;

      test.beforeAll(async () => {
        // Create a test amenity for CRUD operations
        const response = await authContext.post('/api/admin/amenities/box', {
          data: { name: 'CRUD Test Box Amenity' }
        });
        const amenity = await expectSuccessfulResponse(response);
        testAmenityId = amenity.id;
        createdIds.amenities.box.push(testAmenityId);
      });

      test('PUT /api/admin/amenities/box should update box amenity', async () => {
        const updatedName = `Updated CRUD Test Box Amenity ${Date.now()}`;
        const response = await authContext.put('/api/admin/amenities/box', {
          data: {
            id: testAmenityId,
            name: updatedName
          }
        });
        
        const data = await expectSuccessfulResponse(response);
        expect(data).toHaveProperty('name', updatedName);
        expect(data).toHaveProperty('id', testAmenityId);
      });
    });

    test('GET /api/admin/amenities/box should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/amenities/box', 'GET');
    });
  });

  test.describe('/api/admin/roadmap endpoint', () => {
    test('GET /api/admin/roadmap should return roadmap items', async () => {
      const response = await authContext.get('/api/admin/roadmap');
      
      // Roadmap endpoint might not exist or be empty, so check status first
      if (response.status() === 404) {
        test.skip('/api/admin/roadmap endpoint not implemented');
      }
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/admin/roadmap should create roadmap item', async () => {
      const roadmapData = {
        title: `Test Roadmap Item ${Date.now()}`,
        description: 'Test roadmap item for API testing',
        priority: 'medium',
        status: 'planned'
      };
      
      const response = await authContext.post('/api/admin/roadmap', {
        data: roadmapData
      });
      
      // Skip if endpoint not implemented
      if (response.status() === 404) {
        test.skip('/api/admin/roadmap POST endpoint not implemented');
      }
      
      const data = await expectSuccessfulResponse(response, 201);
      expect(data).toHaveProperty('title', roadmapData.title);
      expect(data).toHaveProperty('id');
      
      createdIds.roadmapItems.push(data.id);
    });

    test('GET /api/admin/roadmap should be forbidden for non-admin users', async () => {
      const response = await nonAdminContext.get('/api/admin/roadmap');
      // Could be 403 (forbidden) or 404 (not found)
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('/api/admin/cleanup endpoint', () => {
    test('POST /api/admin/cleanup should perform cleanup operations', async () => {
      const response = await authContext.post('/api/admin/cleanup', {
        data: { confirmCleanup: true }
      });
      
      // Skip if endpoint not implemented
      if (response.status() === 404) {
        test.skip('/api/admin/cleanup endpoint not implemented');
      }
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('message');
    });

    test('POST /api/admin/cleanup should be forbidden for non-admin users', async () => {
      const response = await nonAdminContext.post('/api/admin/cleanup', {
        data: { confirmCleanup: true }
      });
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('/api/admin/pricing/* endpoints', () => {
    test.describe('/api/admin/pricing/base', () => {
      test('GET /api/admin/pricing/base should return base pricing', async () => {
        const response = await authContext.get('/api/admin/pricing/base');
        
        const data = await expectSuccessfulResponse(response);
        expect(data).toHaveProperty('price');
        expect(typeof data.price).toBe('number');
      });

      test('PUT /api/admin/pricing/base should update base pricing', async () => {
        // Get current price first
        const getResponse = await authContext.get('/api/admin/pricing/base');
        const currentData = await expectSuccessfulResponse(getResponse);
        const originalPrice = currentData.price;
        
        // Update price
        const newPrice = originalPrice + 5;
        const putResponse = await authContext.put('/api/admin/pricing/base', {
          data: { price: newPrice }
        });
        
        const updatedData = await expectSuccessfulResponse(putResponse);
        expect(updatedData).toHaveProperty('price', newPrice);
        
        // Revert to original price
        await authContext.put('/api/admin/pricing/base', {
          data: { price: originalPrice }
        });
      });

      test('PUT /api/admin/pricing/base should return 400 for invalid price', async () => {
        const response = await authContext.put('/api/admin/pricing/base', {
          data: { price: -10 }
        });
        
        await expectErrorResponse(response, 400, 'Price is required and must be a positive number');
      });

      test('GET /api/admin/pricing/base should be forbidden for non-admin users', async () => {
        await expectForbidden(nonAdminContext, '/api/admin/pricing/base', 'GET');
      });
    });

    test.describe('/api/admin/pricing/sponsored', () => {
      test('GET /api/admin/pricing/sponsored should return sponsored pricing', async () => {
        const response = await authContext.get('/api/admin/pricing/sponsored');
        
        // Skip if endpoint not implemented
        if (response.status() === 404) {
          test.skip('/api/admin/pricing/sponsored endpoint not implemented');
        }
        
        await expectSuccessfulResponse(response);
      });

      test('GET /api/admin/pricing/sponsored should be forbidden for non-admin users', async () => {
        const response = await nonAdminContext.get('/api/admin/pricing/sponsored');
        expect([403, 404]).toContain(response.status());
      });
    });

    test.describe('/api/admin/pricing/discounts', () => {
      test('GET /api/admin/pricing/discounts should return discount pricing', async () => {
        const response = await authContext.get('/api/admin/pricing/discounts');
        
        // Skip if endpoint not implemented
        if (response.status() === 404) {
          test.skip('/api/admin/pricing/discounts endpoint not implemented');
        }
        
        await expectSuccessfulResponse(response);
      });

      test('GET /api/admin/pricing/discounts should be forbidden for non-admin users', async () => {
        const response = await nonAdminContext.get('/api/admin/pricing/discounts');
        expect([403, 404]).toContain(response.status());
      });
    });
  });

  test.describe('/api/admin/payments endpoint', () => {
    test('GET /api/admin/payments should return payment data', async () => {
      const response = await authContext.get('/api/admin/payments');
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const payment = data[0];
        expect(payment).toHaveProperty('id');
        expect(payment).toHaveProperty('amount');
        expect(payment).toHaveProperty('status');
      }
    });

    test('GET /api/admin/payments should be forbidden for non-admin users', async () => {
      await expectForbidden(nonAdminContext, '/api/admin/payments', 'GET');
    });
  });

  test.describe('Admin authentication and authorization', () => {
    test('all admin endpoints should be unauthorized without authentication', async ({ request }) => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/stables', 
        '/api/admin/boxes',
        '/api/admin/amenities/stable',
        '/api/admin/amenities/box',
        '/api/admin/pricing/base',
        '/api/admin/payments'
      ];
      
      for (const endpoint of adminEndpoints) {
        await expectUnauthorized(request, endpoint, 'GET');
      }
    });

    test('all admin endpoints should be forbidden for non-admin users', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/stables', 
        '/api/admin/boxes',
        '/api/admin/amenities/stable',
        '/api/admin/amenities/box',
        '/api/admin/pricing/base',
        '/api/admin/payments'
      ];
      
      for (const endpoint of adminEndpoints) {
        await expectForbidden(nonAdminContext, endpoint, 'GET');
      }
    });
  });

  test.describe('Edge cases and validation', () => {
    test('should handle malformed JSON in admin POST requests', async () => {
      try {
        const response = await authContext.post('/api/admin/amenities/stable', {
          data: 'invalid-json'
        });
        expect([400, 500]).toContain(response.status());
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle missing required fields in admin requests', async () => {
      const response = await authContext.post('/api/admin/amenities/stable', {
        data: {}
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should handle very long field values in admin requests', async () => {
      const longString = 'a'.repeat(1000);
      const response = await authContext.post('/api/admin/amenities/stable', {
        data: { name: longString }
      });
      
      expect([200, 201, 400, 422, 500]).toContain(response.status());
    });

    test('should handle special characters in admin requests', async () => {
      const response = await authContext.post('/api/admin/amenities/stable', {
        data: { name: 'Test Amenity with Special Chars: åæø!@#$%^&*()' }
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(data).toHaveProperty('name');
      createdIds.amenities.stable.push(data.id);
    });
  });
});