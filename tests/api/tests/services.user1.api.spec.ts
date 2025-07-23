import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestServiceData,
  addAuthHeaders,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for service marketplace endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Tests service CRUD operations, Norwegian business rules, service types,
 * discount system, and marketplace functionality
 */
test.describe('Services API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let createdServiceIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    for (const id of createdServiceIds) {
      try {
        await apiContext.delete(`/api/services/${id}`, {
          headers: addAuthHeaders(authTokens)
        });
      } catch (e) {
        console.warn(`Failed to cleanup service ${id}:`, e);
      }
    }
    
    await apiContext.dispose();
  });

  test.describe('GET /api/services', () => {
    test('should fetch all active services without authentication', async () => {
      const response = await apiContext.get('/api/services');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // Each service should have required fields
      if (data.length > 0) {
        const service = data[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('title');
        expect(service).toHaveProperty('service_type');
        expect(service).toHaveProperty('areas');
        expect(typeof service.id).toBe('string');
        expect(typeof service.title).toBe('string');
      }
    });

    test('should filter services by service_type', async () => {
      const serviceType = 'veterinarian';
      const response = await apiContext.get(`/api/services?service_type=${serviceType}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned services should match the filter
      data.forEach((service: any) => {
        expect(service.service_type).toBe(serviceType);
      });
    });

    test('should filter services by county', async () => {
      const county = 'Oslo';
      const response = await apiContext.get(`/api/services?county=${encodeURIComponent(county)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned services should serve the specified county
      data.forEach((service: any) => {
        expect(service.areas).toBeDefined();
        expect(Array.isArray(service.areas)).toBe(true);
        const servesCounty = service.areas.some((area: any) => area.county === county);
        expect(servesCounty).toBe(true);
      });
    });

    test('should filter services by municipality', async () => {
      const municipality = 'Oslo';
      const response = await apiContext.get(`/api/services?municipality=${encodeURIComponent(municipality)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned services should serve the specified municipality
      data.forEach((service: any) => {
        if (service.areas && service.areas.length > 0) {
          const servesMunicipality = service.areas.some((area: any) => 
            area.municipality === municipality || !area.municipality
          );
          expect(servesMunicipality).toBe(true);
        }
      });
    });

    test('should filter services by price range', async () => {
      const minPrice = 500;
      const maxPrice = 1500;
      const response = await apiContext.get(`/api/services?min_price=${minPrice}&max_price=${maxPrice}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned services should be within price range
      data.forEach((service: any) => {
        if (service.price_range_min !== null && service.price_range_max !== null) {
          // Service price range should overlap with filter range
          expect(service.price_range_min).toBeLessThanOrEqual(maxPrice);
          expect(service.price_range_max).toBeGreaterThanOrEqual(minPrice);
        }
      });
    });

    test('should handle Norwegian characters in county/municipality filters', async () => {
      const norwegianCounty = 'Møre og Romsdal';
      const response = await apiContext.get(`/api/services?county=${encodeURIComponent(norwegianCounty)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // Test that Norwegian characters are properly handled
      data.forEach((service: any) => {
        if (service.areas && service.areas.length > 0) {
          const servesCounty = service.areas.some((area: any) => area.county === norwegianCounty);
          expect(servesCounty).toBe(true);
        }
      });
    });

    test('should fetch user-specific services with authentication', async () => {
      const response = await apiContext.get(`/api/services?user_id=${authTokens.userId}`, {
        headers: addAuthHeaders(authTokens)
      });
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned services should belong to the authenticated user
      data.forEach((service: any) => {
        expect(service.user_id).toBe(authTokens.userId);
      });
    });

    test('should reject unauthorized user-specific requests', async () => {
      const response = await apiContext.get(`/api/services?user_id=${authTokens.userId}`);
      
      await expectErrorResponse(response, 401, 'Unauthorized');
    });

    test('should combine multiple filters correctly', async () => {
      const filters = {
        service_type: 'trainer',
        county: 'Oslo',
        min_price: 500
      };
      
      const queryString = new URLSearchParams(filters).toString();
      const response = await apiContext.get(`/api/services?${queryString}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All services should match all filters
      data.forEach((service: any) => {
        expect(service.service_type).toBe(filters.service_type);
        if (service.areas && service.areas.length > 0) {
          const servesCounty = service.areas.some((area: any) => area.county === filters.county);
          expect(servesCounty).toBe(true);
        }
        if (service.price_range_min !== null) {
          expect(service.price_range_min).toBeGreaterThanOrEqual(Number(filters.min_price));
        }
      });
    });
  });

  test.describe('POST /api/services', () => {
    test('should reject unauthorized requests', async () => {
      await expectUnauthorized(apiContext, '/api/services', 'POST');
    });

    test('should create service with valid data', async () => {
      const serviceData = generateTestServiceData({
        title: 'Test Veterinary Service',
        description: 'Professional veterinary services for horses',
        service_type: 'veterinarian',
        areas: [
          { county: 'Oslo', municipality: 'Oslo' },
          { county: 'Akershus' }
        ],
        price_range_min: 800,
        price_range_max: 1200
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data).toHaveProperty('id');
      expect(data.title).toBe(serviceData.title);
      expect(data.service_type).toBe(serviceData.service_type);
      expect(data.areas).toEqual(serviceData.areas);
      expect(data.price_range_min).toBe(serviceData.price_range_min);
      expect(data.price_range_max).toBe(serviceData.price_range_max);
      
      createdServiceIds.push(data.id);
    });

    test('should handle Norwegian characters in service data', async () => {
      const serviceData = generateTestServiceData({
        title: 'Veterinære tjenester for større hester',
        description: 'Spesialisert på behandling av store hesteraser med særlige behov',
        service_type: 'veterinarian',
        areas: [
          { county: 'Møre og Romsdal', municipality: 'Ålesund' },
          { county: 'Sør-Trøndelag', municipality: 'Trondheim' }
        ]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data.title).toBe(serviceData.title);
      expect(data.description).toBe(serviceData.description);
      expect(data.areas).toEqual(serviceData.areas);
      
      // Verify Norwegian characters are preserved
      expect(data.title).toContain('større');
      expect(data.description).toContain('særlige');
      expect(data.areas[0].county).toContain('Møre og Romsdal');
      expect(data.areas[1].municipality).toContain('Trøndelag');
      
      createdServiceIds.push(data.id);
    });

    test('should validate all service types', async () => {
      const serviceTypes = ['veterinarian', 'farrier', 'trainer', 'chiropractor', 'saddlefitter', 'equestrian_shop'];
      
      for (const serviceType of serviceTypes) {
        const serviceData = generateTestServiceData({
          title: `Test ${serviceType} Service`,
          service_type: serviceType,
          areas: [{ county: 'Oslo' }]
        });

        const response = await apiContext.post('/api/services', {
          data: serviceData,
          headers: addAuthHeaders(authTokens)
        });

        // Note: The current implementation only accepts veterinarian, farrier, trainer
        // This test will help identify if validation needs to be updated
        if (['veterinarian', 'farrier', 'trainer'].includes(serviceType)) {
          const data = await expectSuccessfulResponse(response, 201);
          expect(data.service_type).toBe(serviceType);
          createdServiceIds.push(data.id);
        } else {
          await expectErrorResponse(response, 400, 'Invalid service_type');
        }
      }
    });

    test('should validate required fields', async () => {
      const testCases = [
        { data: {}, expectedError: 'title' },
        { data: { title: 'Test' }, expectedError: 'description' },
        { data: { title: 'Test', description: 'Test desc' }, expectedError: 'service_type' },
        { data: { title: 'Test', description: 'Test desc', service_type: 'veterinarian' }, expectedError: 'areas' },
        { data: { title: 'Test', description: 'Test desc', service_type: 'veterinarian', areas: [] }, expectedError: 'areas' }
      ];

      for (const testCase of testCases) {
        const response = await apiContext.post('/api/services', {
          data: testCase.data,
          headers: addAuthHeaders(authTokens)
        });

        await expectErrorResponse(response, 400, testCase.expectedError);
      }
    });

    test('should reject invalid service types', async () => {
      const serviceData = generateTestServiceData({
        service_type: 'invalid_type',
        areas: [{ county: 'Oslo' }]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400, 'Invalid service_type');
    });

    test('should validate areas structure', async () => {
      const testCases = [
        { areas: 'not_an_array', description: 'non-array areas' },
        { areas: [{}], description: 'areas without county' },
        { areas: [{ county: '' }], description: 'empty county' },
        { areas: [{ municipality: 'Oslo' }], description: 'municipality without county' }
      ];

      for (const testCase of testCases) {
        const serviceData = generateTestServiceData({
          areas: testCase.areas
        });

        const response = await apiContext.post('/api/services', {
          data: serviceData,
          headers: addAuthHeaders(authTokens)
        });

        await expectErrorResponse(response, 400, 'Areas must be an array');
      }
    });

    test('should handle price range validation', async () => {
      const serviceData = generateTestServiceData({
        areas: [{ county: 'Oslo' }],
        price_range_min: 1500,
        price_range_max: 500 // Invalid: max < min
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      // Should either accept it (handled by business logic) or return validation error
      if (response.status() === 201) {
        const data = await response.json();
        createdServiceIds.push(data.id);
      } else {
        expect(response.status()).toBe(400);
      }
    });
  });

  test.describe('GET /api/services/[id]', () => {
    let testServiceId: string;

    test.beforeAll(async () => {
      // Create a test service for individual endpoint tests
      const serviceData = generateTestServiceData({
        title: 'Individual Service Test',
        service_type: 'farrier',
        areas: [{ county: 'Vestland', municipality: 'Bergen' }]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      testServiceId = data.id;
      createdServiceIds.push(testServiceId);
    });

    test('should fetch individual service without authentication', async () => {
      const response = await apiContext.get(`/api/services/${testServiceId}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(data.id).toBe(testServiceId);
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('service_type');
      expect(data.service_type).toBe('farrier');
    });

    test('should return 404 for non-existent service', async () => {
      const fakeId = 'non-existent-id-12345';
      const response = await apiContext.get(`/api/services/${fakeId}`);
      
      await expectErrorResponse(response, 404, 'Service not found');
    });

    test('should handle malformed service IDs', async () => {
      const malformedId = 'invalid-uuid-format';
      const response = await apiContext.get(`/api/services/${malformedId}`);
      
      // Should return 404 or 500 depending on implementation
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('PUT /api/services/[id]', () => {
    let testServiceId: string;

    test.beforeAll(async () => {
      // Create a test service for update tests
      const serviceData = generateTestServiceData({
        title: 'Service Update Test',
        service_type: 'trainer',
        areas: [{ county: 'Rogaland' }]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      testServiceId = data.id;
      createdServiceIds.push(testServiceId);
    });

    test('should reject unauthorized updates', async () => {
      await expectUnauthorized(apiContext, `/api/services/${testServiceId}`, 'PUT');
    });

    test('should update service with valid data', async () => {
      const updateData = {
        title: 'Updated Service Title',
        description: 'Updated description with æøå characters',
        price_range_min: 1000,
        price_range_max: 2000,
        is_active: false
      };

      const response = await apiContext.put(`/api/services/${testServiceId}`, {
        data: updateData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response);
      
      expect(data.title).toBe(updateData.title);
      expect(data.description).toBe(updateData.description);
      expect(data.price_range_min).toBe(updateData.price_range_min);
      expect(data.price_range_max).toBe(updateData.price_range_max);
      expect(data.is_active).toBe(updateData.is_active);
    });

    test('should update service areas with Norwegian locations', async () => {
      const updateData = {
        areas: [
          { county: 'Trøndelag', municipality: 'Trondheim' },
          { county: 'Møre og Romsdal', municipality: 'Ålesund' },
          { county: 'Nordland' } // County without specific municipality
        ]
      };

      const response = await apiContext.put(`/api/services/${testServiceId}`, {
        data: updateData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response);
      expect(data.areas).toEqual(updateData.areas);
    });

    test('should validate service type on update', async () => {
      const updateData = {
        service_type: 'invalid_service_type'
      };

      const response = await apiContext.put(`/api/services/${testServiceId}`, {
        data: updateData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400, 'Invalid service_type');
    });

    test('should validate areas structure on update', async () => {
      const updateData = {
        areas: [{ municipality: 'Oslo' }] // Missing county
      };

      const response = await apiContext.put(`/api/services/${testServiceId}`, {
        data: updateData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400, 'Areas must be an array');
    });

    test('should return 404 for non-existent service update', async () => {
      const fakeId = 'non-existent-id-12345';
      const updateData = { title: 'Updated Title' };

      const response = await apiContext.put(`/api/services/${fakeId}`, {
        data: updateData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 404, 'Service not found');
    });

    test('should handle partial updates', async () => {
      const partialUpdate = {
        title: 'Partially Updated Title'
      };

      const response = await apiContext.put(`/api/services/${testServiceId}`, {
        data: partialUpdate,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response);
      expect(data.title).toBe(partialUpdate.title);
      // Other fields should remain unchanged
      expect(data.service_type).toBe('trainer'); // Original value
    });
  });

  test.describe('DELETE /api/services/[id]', () => {
    test('should reject unauthorized deletions', async () => {
      await expectUnauthorized(apiContext, '/api/services/test-id', 'DELETE');
    });

    test('should delete service with authentication', async () => {
      // Create a service to delete
      const serviceData = generateTestServiceData({
        title: 'Service to Delete',
        service_type: 'veterinarian',
        areas: [{ county: 'Finnmark' }]
      });

      const createResponse = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const createdService = await expectSuccessfulResponse(createResponse, 201);
      
      // Delete the service
      const deleteResponse = await apiContext.delete(`/api/services/${createdService.id}`, {
        headers: addAuthHeaders(authTokens)
      });

      await expectSuccessfulResponse(deleteResponse);
      
      // Verify deletion by trying to fetch
      const fetchResponse = await apiContext.get(`/api/services/${createdService.id}`);
      await expectErrorResponse(fetchResponse, 404);
    });

    test('should return error for deleting non-existent service', async () => {
      const fakeId = 'non-existent-service-id';
      
      const response = await apiContext.delete(`/api/services/${fakeId}`, {
        headers: addAuthHeaders(authTokens)
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('GET /api/services/discounts', () => {
    test('should fetch service discounts without authentication', async () => {
      const response = await apiContext.get('/api/services/discounts');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // Each discount should have expected structure
      if (data.length > 0) {
        const discount = data[0];
        expect(discount).toHaveProperty('id');
        expect(discount).toHaveProperty('service_id');
        expect(discount).toHaveProperty('discount_percentage');
        expect(typeof discount.discount_percentage).toBe('number');
      }
    });

    test('should handle empty discounts gracefully', async () => {
      const response = await apiContext.get('/api/services/discounts');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      // Even if empty, should return valid array structure
    });
  });

  test.describe('Service Marketplace Business Rules', () => {
    test('should handle concurrent service creation by same user', async () => {
      const serviceData1 = generateTestServiceData({
        title: 'Concurrent Service 1',
        service_type: 'veterinarian',
        areas: [{ county: 'Oslo' }]
      });

      const serviceData2 = generateTestServiceData({
        title: 'Concurrent Service 2',
        service_type: 'farrier',
        areas: [{ county: 'Bergen' }]
      });

      const [response1, response2] = await Promise.all([
        apiContext.post('/api/services', {
          data: serviceData1,
          headers: addAuthHeaders(authTokens)
        }),
        apiContext.post('/api/services', {
          data: serviceData2,
          headers: addAuthHeaders(authTokens)
        })
      ]);

      const data1 = await expectSuccessfulResponse(response1, 201);
      const data2 = await expectSuccessfulResponse(response2, 201);

      expect(data1.id).not.toBe(data2.id);
      expect(data1.title).toBe(serviceData1.title);
      expect(data2.title).toBe(serviceData2.title);

      createdServiceIds.push(data1.id, data2.id);
    });

    test('should handle services spanning multiple counties', async () => {
      const serviceData = generateTestServiceData({
        title: 'Multi-County Service',
        service_type: 'trainer',
        areas: [
          { county: 'Oslo' },
          { county: 'Akershus', municipality: 'Bærum' },
          { county: 'Vestfold og Telemark', municipality: 'Tønsberg' },
          { county: 'Buskerud' }
        ]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      
      expect(data.areas).toHaveLength(4);
      expect(data.areas.every((area: any) => area.county)).toBe(true);
      
      createdServiceIds.push(data.id);

      // Verify service appears in searches for each county
      for (const area of serviceData.areas) {
        const searchResponse = await apiContext.get(`/api/services?county=${encodeURIComponent(area.county)}`);
        const searchData = await expectSuccessfulResponse(searchResponse);
        
        const foundService = searchData.find((s: any) => s.id === data.id);
        expect(foundService).toBeDefined();
      }
    });

    test('should handle price range edge cases', async () => {
      const edgeCases = [
        { min: 0, max: 0, description: 'zero price range' },
        { min: 0, max: 10000, description: 'zero minimum' },
        { min: null, max: null, description: 'no price range' },
        { min: 999999, max: 999999, description: 'very high price' }
      ];

      for (const edgeCase of edgeCases) {
        const serviceData = generateTestServiceData({
          title: `Price Test: ${edgeCase.description}`,
          service_type: 'veterinarian',
          areas: [{ county: 'Oslo' }],
          price_range_min: edgeCase.min,
          price_range_max: edgeCase.max
        });

        const response = await apiContext.post('/api/services', {
          data: serviceData,
          headers: addAuthHeaders(authTokens)
        });

        const data = await expectSuccessfulResponse(response, 201);
        expect(data.price_range_min).toBe(edgeCase.min);
        expect(data.price_range_max).toBe(edgeCase.max);
        
        createdServiceIds.push(data.id);
      }
    });

    test('should handle services with photos', async () => {
      const serviceData = generateTestServiceData({
        title: 'Service with Photos',
        service_type: 'farrier',
        areas: [{ county: 'Troms og Finnmark' }],
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      const data = await expectSuccessfulResponse(response, 201);
      expect(data.photos).toEqual(serviceData.photos);
      
      createdServiceIds.push(data.id);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in requests', async () => {
      const response = await apiContext.post('/api/services', {
        data: 'invalid json string',
        headers: addAuthHeaders(authTokens)
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle extremely long service titles and descriptions', async () => {
      const longTitle = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(5000);

      const serviceData = generateTestServiceData({
        title: longTitle,
        description: longDescription,
        service_type: 'trainer',
        areas: [{ county: 'Oslo' }]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      // Should either accept or return validation error
      if (response.status() === 201) {
        const data = await response.json();
        createdServiceIds.push(data.id);
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should handle special characters in service data', async () => {
      const serviceData = generateTestServiceData({
        title: 'Service with <script>alert("xss")</script> & "quotes"',
        description: 'Description with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        service_type: 'veterinarian',
        areas: [{ county: 'Test County & Special Chars' }]
      });

      const response = await apiContext.post('/api/services', {
        data: serviceData,
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 201) {
        const data = await expectSuccessfulResponse(response, 201);
        // Should preserve original data (proper escaping handled by framework)
        expect(data.title).toBe(serviceData.title);
        createdServiceIds.push(data.id);
      } else {
        await expectErrorResponse(response, 400);
      }
    });

    test('should handle database constraint violations gracefully', async () => {
      // Test with null values where not allowed
      const invalidData = {
        title: null,
        description: 'Valid description',
        service_type: 'veterinarian',
        areas: [{ county: 'Oslo' }]
      };

      const response = await apiContext.post('/api/services', {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 400);
    });
  });
});