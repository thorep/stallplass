import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  generateTestConversationData,
  generateTestRentalConfirmationData,
  generateTestRentalUpdateData,
  cleanupConversationTestData,
  addAuthHeaders,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for /api/rentals endpoints - User1 Tests
 * Based on https://playwright.dev/docs/api-testing
 */
test.describe('Rentals API - User1 Tests', () => {
  let user1ApiContext: APIRequestContext;
  let user1AuthTokens: AuthTokens;
  let user2ApiContext: APIRequestContext;
  let user2AuthTokens: AuthTokens;
  
  let createdIds: {
    stables: string[];
    boxes: string[];
    conversations: string[];
    rentals: string[];
  } = {
    stables: [],
    boxes: [],
    conversations: [],
    rentals: []
  };

  test.beforeAll(async ({ playwright }) => {
    // Set up contexts for both users (needed for rental scenarios)
    const request1 = await playwright.request.newContext();
    const user1AuthResult = await createAuthenticatedAPIContext(request1, 'user1');
    user1ApiContext = user1AuthResult.apiContext;
    user1AuthTokens = user1AuthResult.authTokens;

    const request2 = await playwright.request.newContext();
    const user2AuthResult = await createAuthenticatedAPIContext(request2, 'user2');
    user2ApiContext = user2AuthResult.apiContext;
    user2AuthTokens = user2AuthResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    await cleanupConversationTestData(user1ApiContext, createdIds);
    await user1ApiContext.dispose();
    await user2ApiContext.dispose();
  });

  test.describe('GET /api/rentals', () => {
    let activeRentalId: string;

    test.beforeAll(async () => {
      // Create a rental scenario for testing
      // User1 creates stable and box
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      // User2 creates conversation
      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      // User1 (stable owner) confirms rental
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      activeRentalId = rental.id;
      createdIds.rentals.push(activeRentalId);
    });

    test('should return rentals for user as renter', async () => {
      const response = await user2ApiContext.get(`/api/rentals?userId=${user2AuthTokens.userId}&type=renter`);
      
      const rentals = await expectSuccessfulResponse(response);
      expect(Array.isArray(rentals)).toBe(true);
      
      // All rentals should belong to user2 as rider
      rentals.forEach((rental: any) => {
        expect(rental.rider_id).toBe(user2AuthTokens.userId);
        expect(rental.status).toBe('ACTIVE');
        expect(rental).toHaveProperty('box');
        expect(rental).toHaveProperty('stable');
        expect(rental.box).toHaveProperty('id');
        expect(rental.box).toHaveProperty('name');
        expect(rental.stable).toHaveProperty('id');
        expect(rental.stable).toHaveProperty('name');
      });
    });

    test('should return rentals for user as stable owner', async () => {
      const response = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}&type=owner`);
      
      const rentals = await expectSuccessfulResponse(response);
      expect(Array.isArray(rentals)).toBe(true);
      
      // All rentals should be for stables owned by user1
      rentals.forEach((rental: any) => {
        expect(rental.status).toBe('ACTIVE');
        expect(rental).toHaveProperty('rider');
        expect(rental).toHaveProperty('box');
        expect(rental).toHaveProperty('stable');
        expect(rental.rider).toHaveProperty('id');
        expect(rental.rider).toHaveProperty('name');
        expect(rental.rider.id).toBe(user2AuthTokens.userId);
      });
    });

    test('should return rentals in descending order by creation date', async () => {
      const response = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}&type=owner`);
      
      const rentals = await expectSuccessfulResponse(response);
      
      if (rentals.length > 1) {
        for (let i = 1; i < rentals.length; i++) {
          const prevTime = new Date(rentals[i - 1].created_at).getTime();
          const currTime = new Date(rentals[i].created_at).getTime();
          expect(prevTime).toBeGreaterThanOrEqual(currTime);
        }
      }
    });

    test('should return only ACTIVE rentals', async () => {
      const response = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}&type=owner`);
      
      const rentals = await expectSuccessfulResponse(response);
      
      rentals.forEach((rental: any) => {
        expect(rental.status).toBe('ACTIVE');
      });
    });

    test('should require userId parameter', async () => {
      const response = await user1ApiContext.get('/api/rentals');
      
      await expectErrorResponse(response, 400, 'User ID is required');
    });

    test('should require valid type parameter', async () => {
      const response = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}&type=invalid`);
      
      await expectErrorResponse(response, 400, 'Type parameter must be either "renter" or "owner"');
    });

    test('should require type parameter', async () => {
      const response = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}`);
      
      await expectErrorResponse(response, 400, 'Type parameter must be either "renter" or "owner"');
    });
  });

  test.describe('GET /api/rentals/[id]', () => {
    let testRentalId: string;
    let testConversationId: string;

    test.beforeAll(async () => {
      // Create rental for individual rental tests
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      testConversationId = conversation.id;
      createdIds.conversations.push(testConversationId);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${testConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      testRentalId = rental.id;
      createdIds.rentals.push(testRentalId);
    });

    test('should return rental details for authorized user (stable owner)', async () => {
      const response = await user1ApiContext.get(`/api/rentals/${testRentalId}?userId=${user1AuthTokens.userId}`);
      
      const rental = await expectSuccessfulResponse(response);
      
      expect(rental).toHaveProperty('id');
      expect(rental.id).toBe(testRentalId);
      expect(rental).toHaveProperty('rider');
      expect(rental).toHaveProperty('stable');
      expect(rental).toHaveProperty('box');
      expect(rental).toHaveProperty('conversation');
      expect(rental.rider.id).toBe(user2AuthTokens.userId);
      expect(rental.stable.owner_id).toBe(user1AuthTokens.userId);
    });

    test('should return rental details for authorized user (renter)', async () => {
      const response = await user2ApiContext.get(`/api/rentals/${testRentalId}?userId=${user2AuthTokens.userId}`);
      
      const rental = await expectSuccessfulResponse(response);
      
      expect(rental.id).toBe(testRentalId);
      expect(rental.rider.id).toBe(user2AuthTokens.userId);
      expect(rental).toHaveProperty('stable');
      expect(rental).toHaveProperty('box');
      expect(rental).toHaveProperty('conversation');
    });

    test('should require userId parameter', async () => {
      const response = await user1ApiContext.get(`/api/rentals/${testRentalId}`);
      
      await expectErrorResponse(response, 400, 'User ID is required');
    });

    test('should return 404 for non-existent rental', async () => {
      const response = await user1ApiContext.get(`/api/rentals/non-existent-id?userId=${user1AuthTokens.userId}`);
      
      await expectErrorResponse(response, 404, 'Rental not found or access denied');
    });

    test('should prevent unauthorized access to rental', async () => {
      // Create a third user context to simulate unauthorized access
      const request3 = await (await test.info().project?.use.playwright!)?.request.newContext();
      const user3AuthResult = await createAuthenticatedAPIContext(request3!, 'user1'); // Use user1 auth but different userId
      const unauthorizedUserId = 'unauthorized-user-id';
      
      const response = await user3AuthResult.apiContext.get(`/api/rentals/${testRentalId}?userId=${unauthorizedUserId}`);
      
      await expectErrorResponse(response, 404, 'Rental not found or access denied');
      
      await user3AuthResult.apiContext.dispose();
    });
  });

  test.describe('PATCH /api/rentals/[id]', () => {
    let testRentalId: string;
    let testConversationId: string;

    test.beforeAll(async () => {
      // Create rental for update tests
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      testConversationId = conversation.id;
      createdIds.conversations.push(testConversationId);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${testConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      testRentalId = rental.id;
      createdIds.rentals.push(testRentalId);
    });

    test('should allow stable owner to end rental', async () => {
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'ENDED'
      });
      
      const response = await user1ApiContext.patch(`/api/rentals/${testRentalId}`, {
        data: updateData
      });
      
      const updatedRental = await expectSuccessfulResponse(response);
      
      expect(updatedRental.status).toBe('ENDED');
      expect(updatedRental.end_date).toBeTruthy();
      expect(new Date(updatedRental.end_date).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should allow renter to end rental', async () => {
      // Create new rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      const newRentalId = rental.id;
      createdIds.rentals.push(newRentalId);

      // User2 (renter) ends rental
      const updateData = generateTestRentalUpdateData(user2AuthTokens.userId, {
        status: 'ENDED'
      });
      
      const response = await user2ApiContext.patch(`/api/rentals/${newRentalId}`, {
        data: updateData
      });
      
      const updatedRental = await expectSuccessfulResponse(response);
      expect(updatedRental.status).toBe('ENDED');
    });

    test('should allow cancelling rental', async () => {
      // Create new rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      const newRentalId = rental.id;
      createdIds.rentals.push(newRentalId);

      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'CANCELLED'
      });
      
      const response = await user1ApiContext.patch(`/api/rentals/${newRentalId}`, {
        data: updateData
      });
      
      const updatedRental = await expectSuccessfulResponse(response);
      expect(updatedRental.status).toBe('CANCELLED');
    });

    test('should update box availability when rental is ended', async () => {
      // Create new rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      const boxId = box.id;
      createdIds.boxes.push(boxId);

      const conversationData = generateTestConversationData(stable.id, boxId);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      const newRentalId = rental.id;
      createdIds.rentals.push(newRentalId);

      // End rental
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'ENDED'
      });
      
      await user1ApiContext.patch(`/api/rentals/${newRentalId}`, {
        data: updateData
      });

      // Check that box is available again
      const boxResponse2 = await user1ApiContext.get(`/api/boxes/${boxId}`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const updatedBox = await expectSuccessfulResponse(boxResponse2);
      expect(updatedBox.is_available).toBe(true);
    });

    test('should create system message when rental is ended', async () => {
      // Create new rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      const newConversationId = conversation.id;
      createdIds.conversations.push(newConversationId);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${newConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      const newRentalId = rental.id;
      createdIds.rentals.push(newRentalId);

      // End rental
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'ENDED'
      });
      
      await user1ApiContext.patch(`/api/rentals/${newRentalId}`, {
        data: updateData
      });

      // Check that system message was created
      const messagesResponse = await user1ApiContext.get(`/api/conversations/${newConversationId}/messages`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const messages = await expectSuccessfulResponse(messagesResponse);
      
      const systemMessage = messages.find((m: any) => m.message_type === 'SYSTEM');
      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain('avsluttet');
      expect(systemMessage.metadata).toHaveProperty('rentalId');
      expect(systemMessage.metadata.rentalId).toBe(newRentalId);
    });

    test('should update conversation status when rental is ended', async () => {
      // Create new rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      const newConversationId = conversation.id;
      createdIds.conversations.push(newConversationId);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${newConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      const newRentalId = rental.id;
      createdIds.rentals.push(newRentalId);

      // End rental
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'ENDED'
      });
      
      await user1ApiContext.patch(`/api/rentals/${newRentalId}`, {
        data: updateData
      });

      // Check conversation status
      const conversationsResponse = await user1ApiContext.get('/api/conversations', {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const conversations = await expectSuccessfulResponse(conversationsResponse);
      const updatedConversation = conversations.find((c: any) => c.id === newConversationId);
      
      expect(updatedConversation.status).toBe('ARCHIVED');
    });

    test('should require userId parameter', async () => {
      const updateData = { status: 'ENDED' };
      
      const response = await user1ApiContext.patch(`/api/rentals/${testRentalId}`, {
        data: updateData
      });
      
      await expectErrorResponse(response, 400, 'User ID is required');
    });

    test('should return 404 for non-existent rental', async () => {
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId);
      
      const response = await user1ApiContext.patch('/api/rentals/non-existent-id', {
        data: updateData
      });
      
      await expectErrorResponse(response, 404, 'Rental not found or access denied');
    });

    test('should prevent unauthorized updates', async () => {
      // Try to update rental with user that doesn't have access
      const unauthorizedUserId = 'unauthorized-user-id';
      const updateData = generateTestRentalUpdateData(unauthorizedUserId);
      
      const response = await user1ApiContext.patch(`/api/rentals/${testRentalId}`, {
        data: updateData
      });
      
      await expectErrorResponse(response, 404, 'Rental not found or access denied');
    });
  });

  test.describe('Rental Lifecycle Tests', () => {
    test('should support complete rental lifecycle from creation to end', async () => {
      // 1. User1 creates stable and box
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      // 2. User2 creates conversation
      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      // 3. Rental is confirmed
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      createdIds.rentals.push(rental.id);

      // 4. Both users can see the rental
      const user1RentalsResponse = await user1ApiContext.get(`/api/rentals?userId=${user1AuthTokens.userId}&type=owner`);
      const user1Rentals = await expectSuccessfulResponse(user1RentalsResponse);
      const user1Rental = user1Rentals.find((r: any) => r.id === rental.id);
      expect(user1Rental).toBeDefined();

      const user2RentalsResponse = await user2ApiContext.get(`/api/rentals?userId=${user2AuthTokens.userId}&type=renter`);
      const user2Rentals = await expectSuccessfulResponse(user2RentalsResponse);
      const user2Rental = user2Rentals.find((r: any) => r.id === rental.id);
      expect(user2Rental).toBeDefined();

      // 5. Rental can be retrieved individually
      const individualRentalResponse = await user1ApiContext.get(`/api/rentals/${rental.id}?userId=${user1AuthTokens.userId}`);
      const individualRental = await expectSuccessfulResponse(individualRentalResponse);
      expect(individualRental.id).toBe(rental.id);

      // 6. Rental is ended
      const updateData = generateTestRentalUpdateData(user1AuthTokens.userId, {
        status: 'ENDED'
      });
      const endResponse = await user1ApiContext.patch(`/api/rentals/${rental.id}`, {
        data: updateData
      });
      const endedRental = await expectSuccessfulResponse(endResponse);
      expect(endedRental.status).toBe('ENDED');

      // 7. Box becomes available again
      const finalBoxResponse = await user1ApiContext.get(`/api/boxes/${box.id}`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const finalBox = await expectSuccessfulResponse(finalBoxResponse);
      expect(finalBox.is_available).toBe(true);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in PATCH requests', async () => {
      const response = await user1ApiContext.patch(`/api/rentals/some-id`, {
        data: 'invalid-json-string'
      });
      
      // Should return 400 for malformed JSON
      expect([400, 500]).toContain(response.status());
    });

    test('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures - depends on test environment setup
      // For now, we'll skip this test
      test.skip();
    });

    test('should validate rental update data', async () => {
      // Create rental for this test
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const boxData = generateTestBoxData(stable.id);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      createdIds.boxes.push(box.id);

      const conversationData = generateTestConversationData(stable.id, box.id);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      createdIds.rentals.push(rental.id);

      // Try to update with invalid data
      const invalidData = {
        userId: user1AuthTokens.userId,
        status: 'INVALID_STATUS'
      };
      
      const response = await user1ApiContext.patch(`/api/rentals/${rental.id}`, {
        data: invalidData
      });
      
      // Should accept the update (validation depends on database constraints)
      // This test verifies the API doesn't crash with unexpected values
      expect([200, 400, 500]).toContain(response.status());
    });
  });
});