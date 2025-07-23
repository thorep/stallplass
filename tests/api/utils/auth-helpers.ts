import { APIRequestContext, expect } from '@playwright/test';
import { testUsers } from '../../../e2e/fixtures/test-data';

/**
 * API Authentication Helpers
 * Based on https://playwright.dev/docs/api-testing
 */
export interface AuthTokens {
  accessToken: string;
  userId: string;
  userEmail: string;
}

/**
 * Create authenticated API request context with JWT token
 * For testing, we'll add authentication headers to the existing request context
 */
export async function createAuthenticatedAPIContext(
  request: APIRequestContext,
  userType: 'user1' | 'user2' = 'user1'
): Promise<{ apiContext: APIRequestContext; authTokens: AuthTokens }> {
  const user = userType === 'user1' ? testUsers.user1 : testUsers.user2;
  
  // Create a mock authentication token for testing
  // In a real scenario, this would authenticate with Supabase
  const mockToken = `test-jwt-token-${userType}-${Date.now()}`;
  const mockUserId = `${userType}-test-id`;
  
  // Return the same request context but with auth info
  // We'll add headers to individual requests instead
  const authTokens: AuthTokens = {
    accessToken: mockToken,
    userId: mockUserId,
    userEmail: user.email
  };

  return { apiContext: request, authTokens };
}

/**
 * Helper to add authentication headers to a request
 */
export function addAuthHeaders(authTokens: AuthTokens) {
  return {
    'Authorization': `Bearer ${authTokens.accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Test-User': authTokens.userEmail,
    'X-Test-User-Id': authTokens.userId,
  };
}

/**
 * Test helper to verify unauthorized access returns 401
 */
export async function expectUnauthorized(request: APIRequestContext, endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') {
  let response;
  
  switch (method) {
    case 'GET':
      response = await request.get(endpoint);
      break;
    case 'POST':
      response = await request.post(endpoint, { data: {} });
      break;
    case 'PUT':
      response = await request.put(endpoint, { data: {} });
      break;
    case 'DELETE':
      response = await request.delete(endpoint);
      break;
  }
  
  expect(response.status()).toBe(401);
  
  const errorData = await response.json();
  expect(errorData).toHaveProperty('error');
}

/**
 * Test helper to verify forbidden access returns 403
 */
export async function expectForbidden(apiContext: APIRequestContext, endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') {
  let response;
  
  switch (method) {
    case 'GET':
      response = await apiContext.get(endpoint);
      break;
    case 'POST':
      response = await apiContext.post(endpoint, { data: {} });
      break;
    case 'PUT':
      response = await apiContext.put(endpoint, { data: {} });
      break;
    case 'DELETE':
      response = await apiContext.delete(endpoint);
      break;
  }
  
  expect(response.status()).toBe(403);
}

/**
 * Test helper to verify successful response with proper JSON structure
 */
export async function expectSuccessfulResponse(response: any, expectedStatus: number = 200) {
  expect(response.status()).toBe(expectedStatus);
  expect(response.headers()['content-type']).toContain('application/json');
  
  const data = await response.json();
  return data;
}

/**
 * Test helper to verify error response structure
 */
export async function expectErrorResponse(response: any, expectedStatus: number, errorMessage?: string) {
  expect(response.status()).toBe(expectedStatus);
  
  if (response.headers()['content-type']?.includes('application/json')) {
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    
    if (errorMessage) {
      expect(errorData.error).toContain(errorMessage);
    }
    
    return errorData;
  }
}

/**
 * Generate test data for stable creation
 */
export function generateTestStableData(overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    name: `Test Stable ${timestamp}`,
    description: 'A test stable created by API tests',
    location: 'Oslo',
    address: 'Test Street 123',
    city: 'Oslo',
    postal_code: '0123',
    county: 'Oslo',
    municipality: 'Oslo',
    totalBoxes: 5,
    coordinates: { lat: 59.9139, lon: 10.7522 },
    images: [],
    amenityIds: [],
    featured: false,
    ...overrides
  };
}

/**
 * Generate test data for box creation
 */
export function generateTestBoxData(stableId: string, overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    stable_id: stableId,
    name: `Test Box ${timestamp}`,
    description: 'A test box created by API tests',
    price: 2500,
    size: '3x4m',
    is_indoor: true,
    has_window: true,
    has_electricity: true,
    has_water: false,
    max_horse_size: 'large',
    type: 'regular',
    images: [],
    amenityIds: [],
    ...overrides
  };
}

/**
 * Generate test data for user creation
 */
export function generateTestUserData(overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    userId: `test-user-${timestamp}`,
    email: `test-user-${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    phone: '+47123456789',
    ...overrides
  };
}

/**
 * Generate test data for amenity creation
 */
export function generateTestAmenityData(type: 'stable' | 'box', overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    name: `Test ${type} Amenity ${timestamp}`,
    ...overrides
  };
}

/**
 * Generate test data for roadmap item creation
 */
export function generateTestRoadmapData(overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    title: `Test Roadmap Item ${timestamp}`,
    description: 'A test roadmap item created by API tests',
    priority: 'medium',
    status: 'planned',
    category: 'feature',
    ...overrides
  };
}

/**
 * Test helper to verify response has required pagination structure
 */
export async function expectPaginatedResponse(response: any, expectedStatus: number = 200) {
  expect(response.status()).toBe(expectedStatus);
  
  const data = await response.json();
  expect(data).toHaveProperty('data');
  expect(Array.isArray(data.data)).toBe(true);
  expect(data).toHaveProperty('pagination');
  expect(data.pagination).toHaveProperty('page');
  expect(data.pagination).toHaveProperty('limit');
  expect(data.pagination).toHaveProperty('total');
  
  return data;
}

/**
 * Test helper to verify response matches expected schema structure
 */
export async function expectResponseSchema(response: any, schema: object, expectedStatus: number = 200) {
  const data = await expectSuccessfulResponse(response, expectedStatus);
  
  for (const [key, type] of Object.entries(schema)) {
    expect(data).toHaveProperty(key);
    if (type === 'string') {
      expect(typeof data[key]).toBe('string');
    } else if (type === 'number') {
      expect(typeof data[key]).toBe('number');
    } else if (type === 'boolean') {
      expect(typeof data[key]).toBe('boolean');
    } else if (type === 'array') {
      expect(Array.isArray(data[key])).toBe(true);
    } else if (type === 'object') {
      expect(typeof data[key]).toBe('object');
      expect(data[key]).not.toBeNull();
    }
  }
  
  return data;
}

/**
 * Test helper to verify API response time is within acceptable limits
 */
export async function expectResponseTime(response: any, maxTimeMs: number = 5000) {
  const responseTime = response.headers()['x-response-time'] || 
                      response.timing?.responseEnd - response.timing?.requestStart;
                      
  if (responseTime) {
    expect(parseFloat(responseTime)).toBeLessThan(maxTimeMs);
  }
}

/**
 * Test helper to create multiple test items in bulk
 */
export async function createBulkTestData(
  apiContext: APIRequestContext, 
  endpoint: string, 
  dataGenerator: () => any,
  count: number = 3
): Promise<any[]> {
  const createdItems = [];
  
  for (let i = 0; i < count; i++) {
    const testData = dataGenerator();
    const response = await apiContext.post(endpoint, { data: testData });
    
    if (response.ok()) {
      const item = await response.json();
      createdItems.push(item);
    }
  }
  
  return createdItems;
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData(apiContext: APIRequestContext, createdIds: { stables?: string[], boxes?: string[], users?: string[] }) {
  // Clean up in reverse order of dependencies
  
  if (createdIds.boxes) {
    for (const boxId of createdIds.boxes) {
      try {
        await apiContext.delete(`/api/boxes/${boxId}`);
      } catch (e) {
        console.warn(`Failed to cleanup box ${boxId}:`, e);
      }
    }
  }
  
  if (createdIds.stables) {
    for (const stableId of createdIds.stables) {
      try {
        await apiContext.delete(`/api/stables/${stableId}`);
      } catch (e) {
        console.warn(`Failed to cleanup stable ${stableId}:`, e);
      }
    }
  }
  
  if (createdIds.users) {
    for (const userId of createdIds.users) {
      try {
        await apiContext.delete(`/api/users/${userId}`);
      } catch (e) {
        console.warn(`Failed to cleanup user ${userId}:`, e);
      }
    }
  }
}

/**
 * Generate test data for conversation creation
 */
export function generateTestConversationData(stableId: string, boxId?: string, overrides: any = {}) {
  return {
    stableId,
    boxId: boxId || null,
    initialMessage: 'Hello, I am interested in renting this box for my horse.',
    ...overrides
  };
}

/**
 * Generate test data for message creation
 */
export function generateTestMessageData(overrides: any = {}) {
  const timestamp = Date.now();
  
  return {
    content: `Test message ${timestamp}`,
    messageType: 'TEXT',
    metadata: null,
    ...overrides
  };
}

/**
 * Generate test data for rental creation
 */
export function generateTestRentalData(overrides: any = {}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start tomorrow
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3); // 3 months rental
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthlyPrice: 3500,
    ...overrides
  };
}

/**
 * Generate test data for rental confirmation
 */
export function generateTestRentalConfirmationData(userId: string, overrides: any = {}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start tomorrow
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3); // 3 months rental
  
  return {
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthlyPrice: 3500,
    ...overrides
  };
}

/**
 * Generate test data for rental update/status change
 */
export function generateTestRentalUpdateData(userId: string, overrides: any = {}) {
  return {
    userId,
    status: 'ENDED',
    endDate: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Clean up test data after tests - Enhanced version for conversations and rentals
 */
export async function cleanupConversationTestData(
  apiContext: APIRequestContext, 
  createdIds: { 
    stables?: string[], 
    boxes?: string[], 
    conversations?: string[],
    rentals?: string[],
    users?: string[] 
  }
) {
  // Clean up in reverse order of dependencies
  
  // Clean up rentals first (they depend on conversations)
  if (createdIds.rentals) {
    for (const rentalId of createdIds.rentals) {
      try {
        await apiContext.delete(`/api/rentals/${rentalId}`);
      } catch (e) {
        console.warn(`Failed to cleanup rental ${rentalId}:`, e);
      }
    }
  }
  
  // Clean up conversations (they depend on boxes and stables)
  if (createdIds.conversations) {
    for (const conversationId of createdIds.conversations) {
      try {
        await apiContext.delete(`/api/conversations/${conversationId}`);
      } catch (e) {
        console.warn(`Failed to cleanup conversation ${conversationId}:`, e);
      }
    }
  }
  
  // Clean up regular data (boxes, stables, users)
  await cleanupTestData(apiContext, createdIds);
}

/**
 * Enhanced cleanup function for admin test data
 */
export async function cleanupAdminTestData(
  apiContext: APIRequestContext, 
  createdIds: {
    stables?: string[];
    boxes?: string[];
    amenities?: { stable?: string[]; box?: string[] };
    users?: string[];
    roadmapItems?: string[];
  }
) {
  // Clean up amenities
  if (createdIds.amenities?.stable) {
    for (const id of createdIds.amenities.stable) {
      try {
        await apiContext.delete(`/api/admin/amenities/stable?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup stable amenity ${id}:`, e);
      }
    }
  }
  
  if (createdIds.amenities?.box) {
    for (const id of createdIds.amenities.box) {
      try {
        await apiContext.delete(`/api/admin/amenities/box?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup box amenity ${id}:`, e);
      }
    }
  }
  
  // Clean up roadmap items
  if (createdIds.roadmapItems) {
    for (const id of createdIds.roadmapItems) {
      try {
        await apiContext.delete(`/api/admin/roadmap?id=${id}`);
      } catch (e) {
        console.warn(`Failed to cleanup roadmap item ${id}:`, e);
      }
    }
  }
  
  // Clean up regular data
  await cleanupTestData(apiContext, createdIds);
}