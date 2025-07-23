import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  expectSuccessfulResponse,
  expectErrorResponse
} from '../utils/auth-helpers';

/**
 * API Tests for Norwegian location endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Tests Norwegian location data (fylker, kommuner, tettsteder),
 * location hierarchy, search functionality, and Norwegian character handling.
 * These endpoints are public and don't require authentication.
 */
test.describe('Locations API - Public Tests', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    apiContext = request;
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('GET /api/locations/fylker', () => {
    test('should fetch all Norwegian fylker without authentication', async () => {
      const response = await apiContext.get('/api/locations/fylker');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Each fylke should have required fields
      if (data.length > 0) {
        const fylke = data[0];
        expect(fylke).toHaveProperty('id');
        expect(fylke).toHaveProperty('navn');
        expect(typeof fylke.id).toBe('string');
        expect(typeof fylke.navn).toBe('string');
        expect(fylke.navn.length).toBeGreaterThan(0);
      }
    });

    test('should return fylker with Norwegian characters', async () => {
      const response = await apiContext.get('/api/locations/fylker');
      const data = await expectSuccessfulResponse(response);
      
      // Look for fylker with Norwegian characters
      const norwegianFylker = data.filter((fylke: any) => 
        /[æøåÆØÅ]/.test(fylke.navn)
      );
      
      // Should handle Norwegian characters if they exist
      if (norwegianFylker.length > 0) {
        norwegianFylker.forEach((fylke: any) => {
          expect(typeof fylke.navn).toBe('string');
          expect(fylke.navn.length).toBeGreaterThan(0);
        });
      }
      
      // At minimum, should have fylker with proper Norwegian structure
      expect(data.length).toBeGreaterThan(0);
      data.forEach((fylke: any) => {
        expect(typeof fylke.navn).toBe('string');
        expect(fylke.navn.length).toBeGreaterThan(0);
      });
    });

    test('should return fylker sorted consistently', async () => {
      const response = await apiContext.get('/api/locations/fylker');
      const data = await expectSuccessfulResponse(response);
      
      expect(data.length).toBeGreaterThan(1);
      
      // Check if sorted (either by navn or by ID)
      const sortedByName = [...data].sort((a, b) => a.navn.localeCompare(b.navn, 'no'));
      const sortedById = [...data].sort((a, b) => a.id.localeCompare(b.id));
      
      // Should match one of the sorted orders
      const matchesNameSort = JSON.stringify(data) === JSON.stringify(sortedByName);
      const matchesIdSort = JSON.stringify(data) === JSON.stringify(sortedById);
      
      expect(matchesNameSort || matchesIdSort).toBe(true);
    });

    test('should include major Norwegian fylker', async () => {
      const response = await apiContext.get('/api/locations/fylker');
      const data = await expectSuccessfulResponse(response);
      
      const fylkeNames = data.map((f: any) => f.navn);
      
      // Check for some major Norwegian fylker (names may vary with administrative changes)
      const expectedFylker = ['Oslo', 'Vestland', 'Trondelag'];
      const foundExpected = expectedFylker.filter(name => 
        fylkeNames.some((fname: string) => fname.includes(name))
      );
      
      // Should find at least some major fylker
      expect(foundExpected.length).toBeGreaterThan(0);
    });

    test('should return consistent results on multiple requests', async () => {
      const [response1, response2] = await Promise.all([
        apiContext.get('/api/locations/fylker'),
        apiContext.get('/api/locations/fylker')
      ]);

      const data1 = await expectSuccessfulResponse(response1);
      const data2 = await expectSuccessfulResponse(response2);

      expect(data1).toEqual(data2);
    });

    test('should handle response time within acceptable limits', async () => {
      const startTime = Date.now();
      const response = await apiContext.get('/api/locations/fylker');
      const endTime = Date.now();
      
      await expectSuccessfulResponse(response);
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  test.describe('GET /api/locations/kommuner', () => {
    let testFylkeId: string;

    test.beforeAll(async () => {
      // Get a fylke ID for testing
      const response = await apiContext.get('/api/locations/fylker');
      const fylker = await expectSuccessfulResponse(response);
      expect(fylker.length).toBeGreaterThan(0);
      testFylkeId = fylker[0].id;
    });

    test('should fetch all kommuner without fylke filter', async () => {
      const response = await apiContext.get('/api/locations/kommuner');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Each kommune should have required fields
      if (data.length > 0) {
        const kommune = data[0];
        expect(kommune).toHaveProperty('id');
        expect(kommune).toHaveProperty('navn');
        expect(kommune).toHaveProperty('fylke_id');
        expect(typeof kommune.id).toBe('string');
        expect(typeof kommune.navn).toBe('string');
        expect(typeof kommune.fylke_id).toBe('string');
      }
    });

    test('should filter kommuner by fylke_id', async () => {
      const response = await apiContext.get(`/api/locations/kommuner?fylke_id=${testFylkeId}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned kommuner should belong to the specified fylke
      data.forEach((kommune: any) => {
        expect(kommune.fylke_id).toBe(testFylkeId);
      });
    });

    test('should handle Norwegian characters in kommune names', async () => {
      const response = await apiContext.get('/api/locations/kommuner');
      const data = await expectSuccessfulResponse(response);
      
      // Look for kommuner with Norwegian characters
      const norwegianKommuner = data.filter((kommune: any) => 
        /[æøåÆØÅ]/.test(kommune.navn)
      );
      
      // Norway has many kommuner with Norwegian characters
      expect(norwegianKommuner.length).toBeGreaterThan(0);
      
      norwegianKommuner.forEach((kommune: any) => {
        expect(typeof kommune.navn).toBe('string');
        expect(kommune.navn.length).toBeGreaterThan(0);
      });
    });

    test('should include major Norwegian kommuner', async () => {
      const response = await apiContext.get('/api/locations/kommuner');
      const data = await expectSuccessfulResponse(response);
      
      const kommuneNames = data.map((k: any) => k.navn);
      
      // Check for some major Norwegian kommuner
      const expectedKommuner = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'];
      const foundExpected = expectedKommuner.filter(name => 
        kommuneNames.includes(name)
      );
      
      // Should find at least some major kommuner
      expect(foundExpected.length).toBeGreaterThan(0);
    });

    test('should return empty array for non-existent fylke_id', async () => {
      const fakeId = 'non-existent-fylke-id-12345';
      const response = await apiContext.get(`/api/locations/kommuner?fylke_id=${fakeId}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    test('should handle malformed fylke_id parameter', async () => {
      const malformedId = 'invalid-uuid-format';
      const response = await apiContext.get(`/api/locations/kommuner?fylke_id=${malformedId}`);
      const data = await expectSuccessfulResponse(response);
      
      // Should return empty array or handle gracefully
      expect(Array.isArray(data)).toBe(true);
    });

    test('should maintain fylke-kommune relationships', async () => {
      // Get all fylker
      const fylkerResponse = await apiContext.get('/api/locations/fylker');
      const fylker = await expectSuccessfulResponse(fylkerResponse);
      
      // Test relationship for first few fylker
      const testFylker = fylker.slice(0, 3);
      
      for (const fylke of testFylker) {
        const kommunerResponse = await apiContext.get(`/api/locations/kommuner?fylke_id=${fylke.id}`);
        const kommuner = await expectSuccessfulResponse(kommunerResponse);
        
        // All kommuner should belong to this fylke
        kommuner.forEach((kommune: any) => {
          expect(kommune.fylke_id).toBe(fylke.id);
        });
      }
    });
  });

  test.describe('GET /api/locations/tettsteder', () => {
    let testKommuneId: string;

    test.beforeAll(async () => {
      // Get a kommune ID for testing
      const response = await apiContext.get('/api/locations/kommuner');
      const kommuner = await expectSuccessfulResponse(response);
      expect(kommuner.length).toBeGreaterThan(0);
      testKommuneId = kommuner[0].id;
    });

    test('should fetch all tettsteder without kommune filter', async () => {
      const response = await apiContext.get('/api/locations/tettsteder');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Each tettsted should have required fields
      if (data.length > 0) {
        const tettsted = data[0];
        expect(tettsted).toHaveProperty('id');
        expect(tettsted).toHaveProperty('navn');
        expect(tettsted).toHaveProperty('kommune_id');
        expect(typeof tettsted.id).toBe('string');
        expect(typeof tettsted.navn).toBe('string');
        expect(typeof tettsted.kommune_id).toBe('string');
      }
    });

    test('should filter tettsteder by kommune_id', async () => {
      const response = await apiContext.get(`/api/locations/tettsteder?kommune_id=${testKommuneId}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All returned tettsteder should belong to the specified kommune
      data.forEach((tettsted: any) => {
        expect(tettsted.kommune_id).toBe(testKommuneId);
      });
    });

    test('should handle Norwegian characters in tettsted names', async () => {
      const response = await apiContext.get('/api/locations/tettsteder');
      const data = await expectSuccessfulResponse(response);
      
      // Look for tettsteder with Norwegian characters
      const norwegianTettsteder = data.filter((tettsted: any) => 
        /[æøåÆØÅ]/.test(tettsted.navn)
      );
      
      // Should find some tettsteder with Norwegian characters
      if (norwegianTettsteder.length > 0) {
        norwegianTettsteder.forEach((tettsted: any) => {
          expect(typeof tettsted.navn).toBe('string');
          expect(tettsted.navn.length).toBeGreaterThan(0);
        });
      }
    });

    test('should return empty array for non-existent kommune_id', async () => {
      const fakeId = 'non-existent-kommune-id-12345';
      const response = await apiContext.get(`/api/locations/tettsteder?kommune_id=${fakeId}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    test('should maintain kommune-tettsted relationships', async () => {
      // Get some kommuner
      const kommunerResponse = await apiContext.get('/api/locations/kommuner');
      const kommuner = await expectSuccessfulResponse(kommunerResponse);
      
      // Test relationship for first few kommuner
      const testKommuner = kommuner.slice(0, 3);
      
      for (const kommune of testKommuner) {
        const tettstederResponse = await apiContext.get(`/api/locations/tettsteder?kommune_id=${kommune.id}`);
        const tettsteder = await expectSuccessfulResponse(tettstederResponse);
        
        // All tettsteder should belong to this kommune
        tettsteder.forEach((tettsted: any) => {
          expect(tettsted.kommune_id).toBe(kommune.id);
        });
      }
    });
  });

  test.describe('GET /api/locations/search', () => {
    test('should require search query parameter', async () => {
      const response = await apiContext.get('/api/locations/search');
      
      await expectErrorResponse(response, 400, 'Search query is required');
    });

    test('should search locations by name', async () => {
      const searchQuery = 'Oslo';
      const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('fylker');
      expect(data).toHaveProperty('kommuner');
      expect(data).toHaveProperty('tettsteder');
      
      expect(Array.isArray(data.fylker)).toBe(true);
      expect(Array.isArray(data.kommuner)).toBe(true);
      expect(Array.isArray(data.tettsteder)).toBe(true);
      
      // Should find Oslo in results
      const totalResults = data.fylker.length + data.kommuner.length + data.tettsteder.length;
      expect(totalResults).toBeGreaterThan(0);
      
      // Check that results contain the search term
      const allResults = [...data.fylker, ...data.kommuner, ...data.tettsteder];
      const hasMatchingResult = allResults.some((location: any) => 
        location.navn.toLowerCase().includes(searchQuery.toLowerCase())
      );
      expect(hasMatchingResult).toBe(true);
    });

    test('should handle Norwegian characters in search queries', async () => {
      const norwegianQueries = ['Møre', 'Tromsø', 'Bodø', 'Ålesund'];
      
      for (const query of norwegianQueries) {
        const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const data = await expectSuccessfulResponse(response);
        
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('fylker');
        expect(data).toHaveProperty('kommuner');
        expect(data).toHaveProperty('tettsteder');
        
        // If results found, they should contain Norwegian characters properly
        const allResults = [...data.fylker, ...data.kommuner, ...data.tettsteder];
        allResults.forEach((location: any) => {
          expect(typeof location.navn).toBe('string');
          expect(location.navn.length).toBeGreaterThan(0);
        });
      }
    });

    test('should handle partial matches', async () => {
      const partialQuery = 'Ber';
      const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(partialQuery)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(typeof data).toBe('object');
      
      // Should find locations starting with or containing "Ber" (like Bergen)
      const allResults = [...data.fylker, ...data.kommuner, ...data.tettsteder];
      if (allResults.length > 0) {
        const hasPartialMatch = allResults.some((location: any) => 
          location.navn.toLowerCase().includes(partialQuery.toLowerCase())
        );
        expect(hasPartialMatch).toBe(true);
      }
    });

    test('should search across all location types', async () => {
      const commonQuery = 'Oslo';
      const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(commonQuery)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(typeof data).toBe('object');
      
      // Should find Oslo as fylke, kommune, and potentially tettsted
      expect(data.fylker.length + data.kommuner.length + data.tettsteder.length).toBeGreaterThan(0);
      
      // Check that we get results in multiple categories for Oslo
      const categoriesWithResults = [
        data.fylker.length > 0,
        data.kommuner.length > 0,
        data.tettsteder.length > 0
      ].filter(hasResults => hasResults).length;
      
      expect(categoriesWithResults).toBeGreaterThan(0);
    });

    test('should handle empty search results gracefully', async () => {
      const nonExistentQuery = 'ZZZNonExistentLocationName123';
      const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(nonExistentQuery)}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(typeof data).toBe('object');
      expect(Array.isArray(data.fylker)).toBe(true);
      expect(Array.isArray(data.kommuner)).toBe(true);
      expect(Array.isArray(data.tettsteder)).toBe(true);
      expect(data.fylker.length + data.kommuner.length + data.tettsteder.length).toBe(0);
    });

    test('should handle special characters in search queries', async () => {
      const specialQueries = ['Oslo-', 'Bergen & Omegn', 'test@location'];
      
      for (const query of specialQueries) {
        const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const data = await expectSuccessfulResponse(response);
        
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('fylker');
        expect(data).toHaveProperty('kommuner');
        expect(data).toHaveProperty('tettsteder');
        // Should not crash and return valid structure
      }
    });

    test('should handle extremely long search queries', async () => {
      const longQuery = 'A'.repeat(1000);
      const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(longQuery)}`);
      
      // Should either handle gracefully or return validation error
      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('fylker');
        expect(data).toHaveProperty('kommuner');
        expect(data).toHaveProperty('tettsteder');
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should be case insensitive', async () => {
      const queries = ['oslo', 'OSLO', 'Oslo', 'oSlO'];
      const results = [];
      
      for (const query of queries) {
        const response = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const data = await expectSuccessfulResponse(response);
        results.push(data);
      }
      
      // All queries should return similar results (case insensitive)
      if (results[0].fylker.length + results[0].kommuner.length + results[0].tettsteder.length > 0) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i].fylker.length).toBe(results[0].fylker.length);
          expect(results[i].kommuner.length).toBe(results[0].kommuner.length);
          expect(results[i].tettsteder.length).toBe(results[0].tettsteder.length);
        }
      }
    });
  });

  test.describe('Location Hierarchy Integration Tests', () => {
    test('should maintain proper fylke → kommune → tettsted hierarchy', async () => {
      // Get all fylker
      const fylkerResponse = await apiContext.get('/api/locations/fylker');
      const fylker = await expectSuccessfulResponse(fylkerResponse);
      expect(fylker.length).toBeGreaterThan(0);
      
      // Test hierarchy for first fylke
      const testFylke = fylker[0];
      
      // Get kommuner for this fylke
      const kommunerResponse = await apiContext.get(`/api/locations/kommuner?fylke_id=${testFylke.id}`);
      const kommuner = await expectSuccessfulResponse(kommunerResponse);
      
      // Each kommune should belong to the fylke
      kommuner.forEach((kommune: any) => {
        expect(kommune.fylke_id).toBe(testFylke.id);
      });
      
      // If there are kommuner, test tettsteder for first kommune
      if (kommuner.length > 0) {
        const testKommune = kommuner[0];
        
        const tettstederResponse = await apiContext.get(`/api/locations/tettsteder?kommune_id=${testKommune.id}`);
        const tettsteder = await expectSuccessfulResponse(tettstederResponse);
        
        // Each tettsted should belong to the kommune
        tettsteder.forEach((tettsted: any) => {
          expect(tettsted.kommune_id).toBe(testKommune.id);
        });
      }
    });

    test('should find locations through search that exist in hierarchy', async () => {
      // Get some location names from hierarchy
      const fylkerResponse = await apiContext.get('/api/locations/fylker');
      const fylker = await expectSuccessfulResponse(fylkerResponse);
      
      const kommunerResponse = await apiContext.get('/api/locations/kommuner');
      const kommuner = await expectSuccessfulResponse(kommunerResponse);
      
      // Test that search finds these locations
      const testLocations = [
        ...fylker.slice(0, 2).map((f: any) => ({ navn: f.navn, type: 'fylke' })),
        ...kommuner.slice(0, 2).map((k: any) => ({ navn: k.navn, type: 'kommune' }))
      ];
      
      for (const location of testLocations) {
        const searchResponse = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(location.navn)}`);
        const searchResults = await expectSuccessfulResponse(searchResponse);
        
        // Should find the location in appropriate category
        if (location.type === 'fylke') {
          const foundInSearch = searchResults.fylker.some((result: any) => 
            result.navn === location.navn
          );
          expect(foundInSearch).toBe(true);
        } else if (location.type === 'kommune') {
          const foundInSearch = searchResults.kommuner.some((result: any) => 
            result.navn === location.navn
          );
          expect(foundInSearch).toBe(true);
        }
      }
    });

    test('should handle Norwegian postal code regions', async () => {
      // Test some well-known Norwegian regions
      const knownRegions = ['Østlandet', 'Vestlandet', 'Trøndelag', 'Nord-Norge'];
      
      for (const region of knownRegions) {
        const searchResponse = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(region)}`);
        const data = await expectSuccessfulResponse(searchResponse);
        
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('fylker');
        expect(data).toHaveProperty('kommuner');
        expect(data).toHaveProperty('tettsteder');
        // Results may or may not contain these region names, but should handle the search
      }
    });

    test('should validate Norwegian postal code format concepts', async () => {
      // Test search for locations that would have postal codes
      const citiesWithPostalCodes = ['0101', '5000', '7000', '9000']; // Oslo, Bergen, Trondheim, Tromsø area codes
      
      for (const code of citiesWithPostalCodes) {
        const searchResponse = await apiContext.get(`/api/locations/search?q=${encodeURIComponent(code)}`);
        const data = await expectSuccessfulResponse(searchResponse);
        
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('fylker');
        expect(data).toHaveProperty('kommuner');
        expect(data).toHaveProperty('tettsteder');
        // May or may not find results, but should handle postal code patterns
      }
    });
  });

  test.describe('Performance and Reliability Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const requests = [
        apiContext.get('/api/locations/fylker'),
        apiContext.get('/api/locations/kommuner'),
        apiContext.get('/api/locations/tettsteder'),
        apiContext.get('/api/locations/search?q=Oslo'),
        apiContext.get('/api/locations/search?q=Bergen')
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      for (const response of responses) {
        await expectSuccessfulResponse(response);
      }

      // Total time should be reasonable (concurrent execution)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for all concurrent requests
    });

    test('should return consistent results across multiple calls', async () => {
      const endpoints = [
        '/api/locations/fylker',
        '/api/locations/kommuner',
        '/api/locations/tettsteder'
      ];

      for (const endpoint of endpoints) {
        const [response1, response2, response3] = await Promise.all([
          apiContext.get(endpoint),
          apiContext.get(endpoint),
          apiContext.get(endpoint)
        ]);

        const data1 = await expectSuccessfulResponse(response1);
        const data2 = await expectSuccessfulResponse(response2);
        const data3 = await expectSuccessfulResponse(response3);

        expect(data1).toEqual(data2);
        expect(data2).toEqual(data3);
      }
    });

    test('should handle malformed URLs gracefully', async () => {
      const malformedRequests = [
        '/api/locations/fylker?invalid=param',
        '/api/locations/kommuner?fylke_id=',
        '/api/locations/tettsteder?kommune_id=null',
        '/api/locations/search?q='
      ];

      for (const url of malformedRequests) {
        const response = await apiContext.get(url);
        
        // Should return valid response (either success or proper error)
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
        
        if (response.status() >= 400) {
          const errorData = await response.json();
          expect(errorData).toHaveProperty('error');
        } else {
          const data = await response.json();
          // Should return valid structure (either array or search object)
          expect(data).toBeDefined();
        }
      }
    });

    test('should maintain data integrity across all endpoints', async () => {
      // Verify that the same location appears consistently across endpoints
      const searchResponse = await apiContext.get('/api/locations/search?q=Oslo');
      const searchResults = await expectSuccessfulResponse(searchResponse);
      
      if (searchResults.fylker.length > 0) {
        const osloFylke = searchResults.fylker.find((f: any) => f.navn.includes('Oslo'));
        if (osloFylke) {
          const fylkerResponse = await apiContext.get('/api/locations/fylker');
          const fylker = await expectSuccessfulResponse(fylkerResponse);
          
          const fylkeExists = fylker.some((f: any) => f.id === osloFylke.id);
          expect(fylkeExists).toBe(true);
        }
      }
      
      if (searchResults.kommuner.length > 0) {
        const osloKommune = searchResults.kommuner.find((k: any) => k.navn.includes('Oslo'));
        if (osloKommune) {
          const kommunerResponse = await apiContext.get('/api/locations/kommuner');
          const kommuner = await expectSuccessfulResponse(kommunerResponse);
          
          const kommuneExists = kommuner.some((k: any) => k.id === osloKommune.id);
          expect(kommuneExists).toBe(true);
        }
      }
    });
  });
});