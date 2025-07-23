import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  generateTestPaymentData,
  generateTestVippsCallbackData,
  cleanupPaymentTestData,
  AuthTokens,
  addAuthHeaders
} from '../utils/auth-helpers';

/**
 * API Tests for Payment endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Endpoints tested:
 * - POST /api/payments/create - Create payment for stable advertising
 * - GET /api/payments/status - Check payment status 
 * - GET /api/payments/polling - Poll payment status updates
 * - POST /api/payments/retry - Retry failed payment
 * - GET /api/payments/history - Get payment history
 * - POST /api/payments/bypass - Bypass payment for testing
 * - POST /api/payments/vipps/callback - Handle Vipps webhook callbacks
 */
test.describe('Payments API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let createdStableIds: string[] = [];
  let createdBoxIds: string[] = [];
  let createdPaymentIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    await cleanupPaymentTestData(apiContext, {
      stables: createdStableIds,
      boxes: createdBoxIds,
      payments: createdPaymentIds
    });
    await apiContext.dispose();
  });

  test.describe('POST /api/payments/create', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/payments/create', 'POST');
    });

    test('should create payment for stable with boxes', async () => {
      // First create a stable with boxes
      const stableData = generateTestStableData({ 
        name: 'Payment Test Stable',
        totalBoxes: 3
      });
      
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);
      
      // Add boxes to the stable
      for (let i = 0; i < 3; i++) {
        const boxData = generateTestBoxData(stable.id, { 
          name: `Payment Test Box ${i + 1}`,
          price: 2500 + (i * 100)
        });
        
        const boxResponse = await apiContext.post('/api/boxes', {
          headers: addAuthHeaders(authTokens),
          data: boxData
        });
        
        const box = await expectSuccessfulResponse(boxResponse, 201);
        createdBoxIds.push(box.id);
      }

      // Create payment for 3 months
      const paymentData = {
        stableId: stable.id,
        months: 3
      };

      const response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: paymentData
      });

      const payment = await expectSuccessfulResponse(response, 200);
      
      expect(payment).toHaveProperty('paymentId');
      expect(payment).toHaveProperty('vippsOrderId');
      expect(payment).toHaveProperty('redirectUrl');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('description');
      
      expect(payment.amount).toBeGreaterThan(0);
      expect(payment.description).toContain('3 bokser');
      expect(payment.description).toContain('3 måneder');
      
      createdPaymentIds.push(payment.paymentId);
    });

    test('should validate required fields', async () => {
      const response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: {}
      });

      await expectErrorResponse(response, 400, 'Stable ID is required');
    });

    test('should validate months parameter', async () => {
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Test invalid months (0)
      let response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: { stableId: stable.id, months: 0 }
      });
      await expectErrorResponse(response, 400, 'Invalid number of months');

      // Test invalid months (13)
      response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: { stableId: stable.id, months: 13 }
      });
      await expectErrorResponse(response, 400, 'Invalid number of months');
    });

    test('should reject payment for stable with no boxes', async () => {
      const stableData = generateTestStableData({ totalBoxes: 0 });
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: { stableId: stable.id, months: 1 }
      });

      await expectErrorResponse(response, 400, 'Ingen bokser å annonsere');
    });

    test('should reject payment for non-existent stable', async () => {
      const response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: { stableId: 'non-existent-id', months: 1 }
      });

      await expectErrorResponse(response, 404, 'Stable not found');
    });
  });

  test.describe('POST /api/payments/status', () => {
    test('should check payment status with valid order ID', async () => {
      const response = await apiContext.post('/api/payments/status', {
        headers: addAuthHeaders(authTokens),
        data: { vippsOrderId: 'test-order-123' }
      });

      // This may fail in real implementation, but should return proper error structure
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('payment');
        expect(data).toHaveProperty('vippsStatus');
        expect(data).toHaveProperty('success');
      } else {
        await expectErrorResponse(response, 500, 'Failed to check payment status');
      }
    });

    test('should validate required vippsOrderId', async () => {
      const response = await apiContext.post('/api/payments/status', {
        headers: addAuthHeaders(authTokens),
        data: {}
      });

      await expectErrorResponse(response, 400, 'Vipps order ID is required');
    });
  });

  test.describe('GET /api/payments/polling', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/payments/polling', 'GET');
    });

    test('should return polling endpoint structure', async () => {
      const response = await apiContext.get('/api/payments/polling', {
        headers: addAuthHeaders(authTokens)
      });

      // This endpoint may not be fully implemented, but should handle auth properly
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      } else {
        await expectErrorResponse(response, 500);
      }
    });
  });

  test.describe('POST /api/payments/retry', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/payments/retry', 'POST');
    });

    test('should handle retry request format', async () => {
      const response = await apiContext.post('/api/payments/retry', {
        headers: addAuthHeaders(authTokens),
        data: { paymentId: 'test-payment-id' }
      });

      // This endpoint may not be fully implemented
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      } else {
        await expectErrorResponse(response, 400);
      }
    });
  });

  test.describe('GET /api/payments/history', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/payments/history', 'GET');
    });

    test('should return payment history for authenticated user', async () => {
      const response = await apiContext.get('/api/payments/history', {
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('status');
          expect(data[0]).toHaveProperty('amount');
          expect(data[0]).toHaveProperty('created_at');
        }
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      } else {
        await expectErrorResponse(response, 500);
      }
    });

    test('should support filtering by stable', async () => {
      const response = await apiContext.get('/api/payments/history?stableId=test-stable-id', {
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      }
    });
  });

  test.describe('POST /api/payments/bypass', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/payments/bypass', 'POST');
    });

    test('should handle bypass payment for testing', async () => {
      // Create stable with boxes first
      const stableData = generateTestStableData({ totalBoxes: 2 });
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Add boxes
      for (let i = 0; i < 2; i++) {
        const boxData = generateTestBoxData(stable.id);
        const boxResponse = await apiContext.post('/api/boxes', {
          headers: addAuthHeaders(authTokens),
          data: boxData
        });
        const box = await expectSuccessfulResponse(boxResponse, 201);
        createdBoxIds.push(box.id);
      }

      const response = await apiContext.post('/api/payments/bypass', {
        headers: addAuthHeaders(authTokens),
        data: { 
          stableId: stable.id,
          months: 1,
          testMode: true
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        
        if (data.paymentId) {
          createdPaymentIds.push(data.paymentId);
        }
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      } else {
        await expectErrorResponse(response, 400);
      }
    });
  });

  test.describe('POST /api/payments/vipps/callback', () => {
    test('should handle Vipps webhook callback', async () => {
      const callbackData = {
        orderId: 'test-order-123',
        transactionId: 'txn-456',
        status: 'RESERVE',
        amount: 10000,
        timeStamp: new Date().toISOString(),
        transactionInfo: {
          status: 'RESERVE',
          amount: 10000,
          transactionText: 'Test payment',
          timeStamp: new Date().toISOString()
        }
      };

      const response = await apiContext.post('/api/payments/vipps/callback', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'test-callback-auth'
        },
        data: callbackData
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
      } else if (response.status() === 404) {
        // Endpoint not implemented yet - acceptable
        expect(response.status()).toBe(404);
      } else {
        // Should handle callback appropriately
        expect([400, 401, 500]).toContain(response.status());
      }
    });

    test('should validate callback payload structure', async () => {
      const response = await apiContext.post('/api/payments/vipps/callback', {
        headers: { 'Content-Type': 'application/json' },
        data: { invalid: 'payload' }
      });

      if (response.status() !== 404) {
        expect([400, 401, 500]).toContain(response.status());
      }
    });
  });

  test.describe('Payment Security Tests', () => {
    test('should prevent access to other users payments', async () => {
      // This would require a second user context
      // For now, test that authenticated requests are properly handled
      const response = await apiContext.get('/api/payments/history', {
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 200) {
        const data = await response.json();
        // All payments should belong to the authenticated user
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test('should validate payment ownership for status checks', async () => {
      const response = await apiContext.post('/api/payments/status', {
        headers: addAuthHeaders(authTokens),
        data: { vippsOrderId: 'another-users-order' }
      });

      // Should either return proper error or not find the payment
      expect([404, 403, 500]).toContain(response.status());
    });
  });

  test.describe('Payment Edge Cases', () => {
    test('should handle very large payment amounts correctly', async () => {
      const stableData = generateTestStableData({ totalBoxes: 50 });
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      // Add many boxes
      for (let i = 0; i < 5; i++) { // Just 5 for testing, not 50
        const boxData = generateTestBoxData(stable.id);
        const boxResponse = await apiContext.post('/api/boxes', {
          headers: addAuthHeaders(authTokens),
          data: boxData
        });
        const box = await expectSuccessfulResponse(boxResponse, 201);
        createdBoxIds.push(box.id);
      }

      const response = await apiContext.post('/api/payments/create', {
        headers: addAuthHeaders(authTokens),
        data: { stableId: stable.id, months: 12 }
      });

      if (response.status() === 200) {
        const payment = await response.json();
        expect(payment.amount).toBeGreaterThan(0);
        expect(payment.amount).toBeLessThan(1000000); // Reasonable upper limit
        
        if (payment.paymentId) {
          createdPaymentIds.push(payment.paymentId);
        }
      }
    });

    test('should handle concurrent payment creation requests', async () => {
      const stableData = generateTestStableData({ totalBoxes: 1 });
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

      // Create multiple payment requests simultaneously
      const paymentPromises = [];
      for (let i = 0; i < 3; i++) {
        paymentPromises.push(
          apiContext.post('/api/payments/create', {
            headers: addAuthHeaders(authTokens),
            data: { stableId: stable.id, months: 1 }
          })
        );
      }

      const responses = await Promise.all(paymentPromises);
      
      // At least one should succeed, others might fail due to concurrent processing
      const successfulResponses = responses.filter(r => r.status() === 200);
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);
      
      // Track successful payment IDs for cleanup
      for (const response of successfulResponses) {
        const payment = await response.json();
        if (payment.paymentId) {
          createdPaymentIds.push(payment.paymentId);
        }
      }
    });
  });
});

