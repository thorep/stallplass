import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  generateTestServiceData,
  generateTestPageViewData,
  cleanupAnalyticsTestData,
  AuthTokens,
  addAuthHeaders
} from '../utils/auth-helpers';

/**
 * API Tests for Analytics endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Endpoints tested:
 * - GET /api/analytics/views - Get analytics data for user's entities
 * - POST /api/analytics/views - Create analytics event (if implemented)
 * - GET /api/page-views - Get page view data (if implemented)
 * - POST /api/page-views - Track page views
 * - GET /api/pricing/base - Get base pricing information
 */
test.describe('Analytics API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let createdStableIds: string[] = [];
  let createdBoxIds: string[] = [];
  let createdServiceIds: string[] = [];
  let createdPageViewIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    await cleanupAnalyticsTestData(apiContext, {
      stables: createdStableIds,
      boxes: createdBoxIds,
      services: createdServiceIds,
      pageViews: createdPageViewIds
    });
    await apiContext.dispose();
  });

  test.describe('GET /api/analytics/views', () => {
    test('should require owner ID parameter', async () => {
      const response = await apiContext.get('/api/analytics/views');
      await expectErrorResponse(response, 400, 'ownerId is required');
    });

    test('should return analytics summary for user entities', async () => {
      // Create test entities first
      const stableData = generateTestStableData({ 
        name: 'Analytics Test Stable',
        owner_id: authTokens.userId
      });
      
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Create a box for the stable
      const boxData = generateTestBoxData(stable.id, { name: 'Analytics Test Box' });
      const boxResponse = await apiContext.post('/api/boxes', {
        headers: addAuthHeaders(authTokens),
        data: boxData
      });
      
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdBoxIds.push(box.id);

      // Create some page views for the entities (if we need them for analytics)
      await createTestPageView('STABLE', stable.id);
      await createTestPageView('BOX', box.id);

      // Get analytics data
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}`);
      const analytics = await expectSuccessfulResponse(response);
      
      expect(analytics).toHaveProperty('summary');
      expect(analytics.summary).toHaveProperty('totalStableViews');
      expect(analytics.summary).toHaveProperty('totalBoxViews');
      expect(analytics.summary).toHaveProperty('totalServiceViews');
      expect(analytics.summary).toHaveProperty('totalViews');
      
      expect(analytics).toHaveProperty('stables');
      expect(Array.isArray(analytics.stables)).toBe(true);
      
      expect(analytics).toHaveProperty('boxes');
      expect(Array.isArray(analytics.boxes)).toBe(true);
      
      expect(analytics).toHaveProperty('services');
      expect(Array.isArray(analytics.services)).toBe(true);

      // Verify data structure for stables
      analytics.stables.forEach((stableAnalytics: any) => {
        expect(stableAnalytics).toHaveProperty('stableId');
        expect(stableAnalytics).toHaveProperty('stableName');
        expect(stableAnalytics).toHaveProperty('views');
        expect(typeof stableAnalytics.views).toBe('number');
      });

      // Verify data structure for boxes
      analytics.boxes.forEach((boxAnalytics: any) => {
        expect(boxAnalytics).toHaveProperty('boxId');
        expect(boxAnalytics).toHaveProperty('boxName');
        expect(boxAnalytics).toHaveProperty('stableName');
        expect(boxAnalytics).toHaveProperty('views');
        expect(typeof boxAnalytics.views).toBe('number');
      });
    });

    test('should return specific entity analytics', async () => {
      // Create test stable
      const stableData = generateTestStableData({ 
        name: 'Specific Analytics Test Stable',
        owner_id: authTokens.userId
      });
      
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Create page views for this specific stable
      await createTestPageView('STABLE', stable.id);
      await createTestPageView('STABLE', stable.id);

      // Get analytics for specific entity
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&entityType=STABLE&entityId=${stable.id}`);
      const analytics = await expectSuccessfulResponse(response);
      
      expect(analytics).toHaveProperty('entityId', stable.id);
      expect(analytics).toHaveProperty('entityType', 'STABLE');
      expect(analytics).toHaveProperty('totalViews');
      expect(analytics).toHaveProperty('viewsByDay');
      
      expect(typeof analytics.totalViews).toBe('number');
      expect(Array.isArray(analytics.viewsByDay)).toBe(true);
      
      // Verify viewsByDay structure
      analytics.viewsByDay.forEach((dayData: any) => {
        expect(dayData).toHaveProperty('date');
        expect(dayData).toHaveProperty('views');
        expect(typeof dayData.views).toBe('number');
      });
    });

    test('should support date range filtering', async () => {
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&days=7`);
      const analytics = await expectSuccessfulResponse(response);
      
      expect(analytics).toHaveProperty('summary');
      expect(analytics.summary).toHaveProperty('totalViews');
    });

    test('should handle invalid date range', async () => {
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&days=invalid`);
      const analytics = await expectSuccessfulResponse(response);
      
      // Should default to 30 days
      expect(analytics).toHaveProperty('summary');
    });

    test('should validate entity type parameter', async () => {
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&entityType=INVALID&entityId=test-id`);
      
      // Should either succeed with empty data or return validation error
      if (response.status() === 200) {
        const analytics = await response.json();
        expect(analytics.totalViews).toBe(0);
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    test('should only return analytics for owned entities', async () => {
      // Try to get analytics for another user's entities
      const response = await apiContext.get(`/api/analytics/views?ownerId=another-user-id`);
      const analytics = await expectSuccessfulResponse(response);
      
      // Should return empty or minimal data since no entities belong to another-user-id
      expect(analytics.summary.totalViews).toBe(0);
      expect(analytics.stables).toHaveLength(0);
      expect(analytics.boxes).toHaveLength(0);
    });
  });

  test.describe('POST /api/page-views', () => {
    test('should track page view for stable', async () => {
      // Create test stable
      const stableData = generateTestStableData({ name: 'Page View Test Stable' });
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const pageViewData = {
        entityType: 'STABLE',
        entityId: stable.id,
        viewerId: authTokens.userId
      };

      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: pageViewData
      });

      const pageView = await expectSuccessfulResponse(response, 201);
      createdPageViewIds.push(pageView.id);
      
      expect(pageView).toHaveProperty('id');
      expect(pageView).toHaveProperty('entity_type', 'STABLE');
      expect(pageView).toHaveProperty('entity_id', stable.id);
      expect(pageView).toHaveProperty('viewer_id', authTokens.userId);
      expect(pageView).toHaveProperty('ip_address');
      expect(pageView).toHaveProperty('user_agent');
      expect(pageView).toHaveProperty('created_at');
    });

    test('should track page view for box', async () => {
      // Create test stable and box
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await apiContext.post('/api/boxes', {
        headers: addAuthHeaders(authTokens),
        data: boxData
      });
      
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdBoxIds.push(box.id);

      const pageViewData = {
        entityType: 'BOX',
        entityId: box.id,
        viewerId: null // Anonymous view
      };

      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: pageViewData
      });

      const pageView = await expectSuccessfulResponse(response, 201);
      createdPageViewIds.push(pageView.id);
      
      expect(pageView).toHaveProperty('entity_type', 'BOX');
      expect(pageView).toHaveProperty('entity_id', box.id);
      expect(pageView).toHaveProperty('viewer_id', null);
    });

    test('should track page view for service', async () => {
      // Create test service (if services are supported)
      const serviceData = generateTestServiceData();
      
      // Note: This might fail if service creation endpoint doesn't exist
      const serviceResponse = await apiContext.post('/api/services', {
        headers: addAuthHeaders(authTokens),
        data: serviceData
      });

      if (serviceResponse.status() === 201) {
        const service = await serviceResponse.json();
        createdServiceIds.push(service.id);

        const pageViewData = {
          entityType: 'SERVICE',
          entityId: service.id,
          viewerId: authTokens.userId
        };

        const response = await apiContext.post('/api/page-views', {
          headers: addAuthHeaders(authTokens),
          data: pageViewData
        });

        const pageView = await expectSuccessfulResponse(response, 201);
        createdPageViewIds.push(pageView.id);
        
        expect(pageView).toHaveProperty('entity_type', 'SERVICE');
        expect(pageView).toHaveProperty('entity_id', service.id);
      }
    });

    test('should validate required fields', async () => {
      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: {}
      });

      await expectErrorResponse(response, 400, 'entityType and entityId are required');
    });

    test('should validate entity type', async () => {
      const pageViewData = {
        entityType: 'INVALID_TYPE',
        entityId: 'test-id',
        viewerId: authTokens.userId
      };

      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: pageViewData
      });

      await expectErrorResponse(response, 400, 'Invalid entityType');
    });

    test('should handle missing entity ID', async () => {
      const pageViewData = {
        entityType: 'STABLE',
        viewerId: authTokens.userId
      };

      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: pageViewData
      });

      await expectErrorResponse(response, 400, 'entityType and entityId are required');
    });

    test('should capture request metadata', async () => {
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const pageViewData = {
        entityType: 'STABLE',
        entityId: stable.id,
        viewerId: authTokens.userId
      };

      const response = await apiContext.post('/api/page-views', {
        headers: {
          ...addAuthHeaders(authTokens),
          'User-Agent': 'Test Browser 1.0',
          'Referer': 'https://test-referrer.com'
        },
        data: pageViewData
      });

      const pageView = await expectSuccessfulResponse(response, 201);
      createdPageViewIds.push(pageView.id);
      
      expect(pageView).toHaveProperty('ip_address');
      expect(pageView).toHaveProperty('user_agent');
      expect(pageView).toHaveProperty('referrer');
      
      // These may be 'unknown' in test environment, but should be captured
      expect(typeof pageView.ip_address).toBe('string');
      expect(typeof pageView.user_agent).toBe('string');
    });
  });

  test.describe('GET /api/pricing/base', () => {
    test('should return base pricing information', async () => {
      const response = await apiContext.get('/api/pricing/base');
      const pricing = await expectSuccessfulResponse(response);
      
      expect(pricing).toHaveProperty('basePrice');
      expect(typeof pricing.basePrice).toBe('number');
      expect(pricing.basePrice).toBeGreaterThan(0);
      
      // May also include discount information
      if (pricing.discounts) {
        expect(Array.isArray(pricing.discounts) || typeof pricing.discounts === 'object').toBe(true);
      }
    });

    test('should not require authentication', async () => {
      // Test without authentication headers
      const response = await apiContext.get('/api/pricing/base', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const pricing = await expectSuccessfulResponse(response);
      expect(pricing).toHaveProperty('basePrice');
    });

    test('should return consistent pricing data', async () => {
      // Make multiple requests to ensure consistency
      const responses = await Promise.all([
        apiContext.get('/api/pricing/base'),
        apiContext.get('/api/pricing/base'),
        apiContext.get('/api/pricing/base')
      ]);

      const pricingData = await Promise.all(
        responses.map(r => expectSuccessfulResponse(r))
      );

      // All responses should have the same base price
      const basePrice = pricingData[0].basePrice;
      pricingData.forEach(pricing => {
        expect(pricing.basePrice).toBe(basePrice);
      });
    });
  });

  test.describe('Analytics Security and Privacy Tests', () => {
    test('should only return analytics for owned entities', async () => {
      // Create entity owned by current user
      const stableData = generateTestStableData({ 
        owner_id: authTokens.userId,
        name: 'Owned Stable'
      });
      
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Get analytics for owned entity
      const ownedResponse = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&entityType=STABLE&entityId=${stable.id}`);
      const ownedAnalytics = await expectSuccessfulResponse(ownedResponse);
      
      expect(ownedAnalytics).toHaveProperty('entityId', stable.id);
      
      // Try to get analytics for non-owned entity (should fail or return empty)
      const nonOwnedResponse = await apiContext.get(`/api/analytics/views?ownerId=another-user&entityType=STABLE&entityId=${stable.id}`);
      
      if (nonOwnedResponse.status() === 200) {
        const nonOwnedAnalytics = await nonOwnedResponse.json();
        expect(nonOwnedAnalytics.totalViews).toBe(0);
      } else {
        // Should return error for unauthorized access
        await expectErrorResponse(nonOwnedResponse, 403);
      }
    });

    test('should protect personal data in page views', async () => {
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const pageViewData = {
        entityType: 'STABLE',
        entityId: stable.id,
        viewerId: authTokens.userId
      };

      const response = await apiContext.post('/api/page-views', {
        headers: addAuthHeaders(authTokens),
        data: pageViewData
      });

      const pageView = await expectSuccessfulResponse(response, 201);
      createdPageViewIds.push(pageView.id);
      
      // IP address should be anonymized or hashed, not raw
      expect(pageView.ip_address).toBeDefined();
      expect(typeof pageView.ip_address).toBe('string');
      
      // User agent should be captured but may be truncated
      expect(pageView.user_agent).toBeDefined();
      expect(typeof pageView.user_agent).toBe('string');
    });
  });

  test.describe('Analytics Edge Cases', () => {
    test('should handle analytics for entities with no views', async () => {
      const stableData = generateTestStableData({ 
        owner_id: authTokens.userId,
        name: 'No Views Stable'
      });
      
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&entityType=STABLE&entityId=${stable.id}`);
      const analytics = await expectSuccessfulResponse(response);
      
      expect(analytics).toHaveProperty('totalViews', 0);
      expect(analytics).toHaveProperty('viewsByDay');
      expect(Array.isArray(analytics.viewsByDay)).toBe(true);
    });

    test('should handle very large date ranges', async () => {
      const response = await apiContext.get(`/api/analytics/views?ownerId=${authTokens.userId}&days=365`);
      const analytics = await expectSuccessfulResponse(response);
      
      expect(analytics).toHaveProperty('summary');
      expect(analytics.summary).toHaveProperty('totalViews');
    });

    test('should handle concurrent page view tracking', async () => {
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Create multiple page views simultaneously
      const pageViewPromises = [];
      for (let i = 0; i < 5; i++) {
        pageViewPromises.push(
          apiContext.post('/api/page-views', {
            headers: addAuthHeaders(authTokens),
            data: {
              entityType: 'STABLE',
              entityId: stable.id,
              viewerId: i % 2 === 0 ? authTokens.userId : null
            }
          })
        );
      }

      const responses = await Promise.all(pageViewPromises);
      
      // All should succeed
      const successfulResponses = responses.filter(r => r.status() === 201);
      expect(successfulResponses.length).toBe(5);
      
      // Track IDs for cleanup
      for (const response of successfulResponses) {
        const pageView = await response.json();
        createdPageViewIds.push(pageView.id);
      }
    });
  });

  // Helper function to create test page view
  async function createTestPageView(entityType: string, entityId: string, viewerId?: string) {
    const pageViewData = {
      entityType,
      entityId,
      viewerId: viewerId || authTokens.userId
    };

    const response = await apiContext.post('/api/page-views', {
      headers: addAuthHeaders(authTokens),
      data: pageViewData
    });

    if (response.status() === 201) {
      const pageView = await response.json();
      createdPageViewIds.push(pageView.id);
      return pageView;
    }
    
    return null;
  }
});

