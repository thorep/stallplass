import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  expectForbidden,
  generateTestStableData,
  generateTestBoxData,
  generateTestConversationData,
  generateTestMessageData,
  generateTestRentalConfirmationData,
  cleanupConversationTestData,
  addAuthHeaders,
  AuthTokens
} from '../utils/auth-helpers';

/**
 * API Tests for /api/conversations endpoints - User2 Tests (Multi-user scenarios)
 * Based on https://playwright.dev/docs/api-testing
 */
test.describe('Conversations API - User2 Multi-User Tests', () => {
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
    // Set up contexts for both users
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
    // Clean up created test data using user1 context (stable owner)
    await cleanupConversationTestData(user1ApiContext, createdIds);
    await user1ApiContext.dispose();
    await user2ApiContext.dispose();
  });

  test.describe('Cross-User Conversation Creation', () => {
    let user1StableId: string;
    let user1BoxId: string;

    test.beforeAll(async () => {
      // User1 creates a stable and box
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      user1StableId = stable.id;
      createdIds.stables.push(user1StableId);

      const boxData = generateTestBoxData(user1StableId);
      const boxResponse = await user1ApiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      user1BoxId = box.id;
      createdIds.boxes.push(user1BoxId);
    });

    test('should allow user2 to create conversation with user1 stable', async () => {
      const conversationData = generateTestConversationData(user1StableId, user1BoxId);
      
      const response = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      const createdConversation = await expectSuccessfulResponse(response, 200);
      createdIds.conversations.push(createdConversation.id);
      
      expect(createdConversation).toHaveProperty('id');
      expect(createdConversation.rider_id).toBe(user2AuthTokens.userId);
      expect(createdConversation.stable_id).toBe(user1StableId);
      expect(createdConversation.box_id).toBe(user1BoxId);
      expect(createdConversation).toHaveProperty('rider');
      expect(createdConversation).toHaveProperty('stable');
      expect(createdConversation).toHaveProperty('box');
    });

    test('should create initial message from user2 when creating conversation', async () => {
      const conversationData = generateTestConversationData(user1StableId, user1BoxId, {
        initialMessage: 'Hello from user2! I am interested in this box.'
      });
      
      const response = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      const createdConversation = await expectSuccessfulResponse(response, 200);
      createdIds.conversations.push(createdConversation.id);
      
      // Check that messages were included
      expect(createdConversation).toHaveProperty('messages');
      expect(Array.isArray(createdConversation.messages)).toBe(true);
      expect(createdConversation.messages.length).toBeGreaterThan(0);
      
      // Verify initial message content
      const initialMessage = createdConversation.messages[0];
      expect(initialMessage.content).toBe(conversationData.initialMessage);
    });

    test('should allow both users to see the same conversation', async () => {
      // User2 creates conversation
      const conversationData = generateTestConversationData(user1StableId, user1BoxId);
      const createResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const createdConversation = await expectSuccessfulResponse(createResponse, 200);
      createdIds.conversations.push(createdConversation.id);

      // User1 (stable owner) should see the conversation
      const user1Response = await user1ApiContext.get('/api/conversations', {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const user1Conversations = await expectSuccessfulResponse(user1Response);
      const user1FoundConversation = user1Conversations.find((c: any) => c.id === createdConversation.id);
      expect(user1FoundConversation).toBeDefined();

      // User2 (rider) should also see the conversation
      const user2Response = await user2ApiContext.get('/api/conversations', {
        headers: addAuthHeaders(user2AuthTokens)
      });
      const user2Conversations = await expectSuccessfulResponse(user2Response);
      const user2FoundConversation = user2Conversations.find((c: any) => c.id === createdConversation.id);
      expect(user2FoundConversation).toBeDefined();
    });
  });

  test.describe('Cross-User Message Exchange', () => {
    let conversationId: string;

    test.beforeAll(async () => {
      // Create a stable and box with user1
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
      conversationId = conversation.id;
      createdIds.conversations.push(conversationId);
    });

    test('should allow user2 (rider) to send messages', async () => {
      const messageData = generateTestMessageData({
        content: 'Message from user2 (rider)'
      });
      
      const response = await user2ApiContext.post(`/api/conversations/${conversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      const createdMessage = await expectSuccessfulResponse(response, 200);
      expect(createdMessage.sender_id).toBe(user2AuthTokens.userId);
      expect(createdMessage.content).toBe(messageData.content);
    });

    test('should allow user1 (stable owner) to send messages', async () => {
      const messageData = generateTestMessageData({
        content: 'Message from user1 (stable owner)'
      });
      
      const response = await user1ApiContext.post(`/api/conversations/${conversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      
      const createdMessage = await expectSuccessfulResponse(response, 200);
      expect(createdMessage.sender_id).toBe(user1AuthTokens.userId);
      expect(createdMessage.content).toBe(messageData.content);
    });

    test('should allow both users to read all messages in conversation', async () => {
      // User1 reads messages
      const user1Response = await user1ApiContext.get(`/api/conversations/${conversationId}/messages`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const user1Messages = await expectSuccessfulResponse(user1Response);

      // User2 reads messages
      const user2Response = await user2ApiContext.get(`/api/conversations/${conversationId}/messages`, {
        headers: addAuthHeaders(user2AuthTokens)
      });
      const user2Messages = await expectSuccessfulResponse(user2Response);

      // Both users should see the same messages
      expect(user1Messages.length).toBe(user2Messages.length);
      expect(user1Messages.length).toBeGreaterThan(0);

      // Verify messages from both users are present
      const user1MessageExists = user1Messages.some((m: any) => m.sender_id === user1AuthTokens.userId);
      const user2MessageExists = user1Messages.some((m: any) => m.sender_id === user2AuthTokens.userId);
      expect(user1MessageExists).toBe(true);
      expect(user2MessageExists).toBe(true);
    });

    test('should maintain correct message order for both users', async () => {
      // Send several messages alternating between users
      await user2ApiContext.post(`/api/conversations/${conversationId}/messages`, {
        data: generateTestMessageData({ content: 'User2 message 1' }),
        headers: addAuthHeaders(user2AuthTokens)
      });

      await user1ApiContext.post(`/api/conversations/${conversationId}/messages`, {
        data: generateTestMessageData({ content: 'User1 reply 1' }),
        headers: addAuthHeaders(user1AuthTokens)
      });

      await user2ApiContext.post(`/api/conversations/${conversationId}/messages`, {
        data: generateTestMessageData({ content: 'User2 message 2' }),
        headers: addAuthHeaders(user2AuthTokens)
      });

      // Both users should see messages in the same chronological order
      const user1Response = await user1ApiContext.get(`/api/conversations/${conversationId}/messages`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const user1Messages = await expectSuccessfulResponse(user1Response);

      const user2Response = await user2ApiContext.get(`/api/conversations/${conversationId}/messages`, {
        headers: addAuthHeaders(user2AuthTokens)
      });
      const user2Messages = await expectSuccessfulResponse(user2Response);

      // Verify same order
      expect(user1Messages.length).toBe(user2Messages.length);
      for (let i = 0; i < user1Messages.length; i++) {
        expect(user1Messages[i].id).toBe(user2Messages[i].id);
        expect(user1Messages[i].created_at).toBe(user2Messages[i].created_at);
      }
    });
  });

  test.describe('Rental Confirmation Workflow', () => {
    let conversationId: string;
    let boxId: string;

    test.beforeAll(async () => {
      // Create stable and box with user1
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
      boxId = box.id;
      createdIds.boxes.push(boxId);

      // User2 creates conversation
      const conversationData = generateTestConversationData(stable.id, boxId);
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      conversationId = conversation.id;
      createdIds.conversations.push(conversationId);
    });

    test('should allow stable owner (user1) to confirm rental', async () => {
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      
      const response = await user1ApiContext.post(`/api/conversations/${conversationId}/confirm-rental`, {
        data: rentalData
      });
      
      const confirmedRental = await expectSuccessfulResponse(response, 200);
      createdIds.rentals.push(confirmedRental.id);
      
      expect(confirmedRental).toHaveProperty('id');
      expect(confirmedRental.conversation_id).toBe(conversationId);
      expect(confirmedRental.rider_id).toBe(user2AuthTokens.userId);
      expect(confirmedRental.box_id).toBe(boxId);
      expect(confirmedRental.status).toBe('ACTIVE');
      expect(confirmedRental.monthly_price).toBe(rentalData.monthlyPrice);
    });

    test('should allow rider (user2) to confirm rental', async () => {
      // Create new conversation for this test
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

      // User2 (rider) confirms rental
      const rentalData = generateTestRentalConfirmationData(user2AuthTokens.userId);
      
      const response = await user2ApiContext.post(`/api/conversations/${newConversationId}/confirm-rental`, {
        data: rentalData
      });
      
      const confirmedRental = await expectSuccessfulResponse(response, 200);
      createdIds.rentals.push(confirmedRental.id);
      
      expect(confirmedRental.rider_id).toBe(user2AuthTokens.userId);
      expect(confirmedRental.status).toBe('ACTIVE');
    });

    test('should create system message when rental is confirmed', async () => {
      // Create new conversation for this test
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

      // Confirm rental
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${newConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      createdIds.rentals.push(rental.id);

      // Check that system message was created
      const messagesResponse = await user1ApiContext.get(`/api/conversations/${newConversationId}/messages`, {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const messages = await expectSuccessfulResponse(messagesResponse);
      
      const systemMessage = messages.find((m: any) => m.message_type === 'RENTAL_CONFIRMATION');
      expect(systemMessage).toBeDefined();
      expect(systemMessage.sender_id).toBe(user1AuthTokens.userId);
      expect(systemMessage.metadata).toHaveProperty('rentalId');
      expect(systemMessage.metadata.rentalId).toBe(rental.id);
    });

    test('should update conversation status when rental is confirmed', async () => {
      // Create new conversation for this test
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

      // Confirm rental
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      const rentalResponse = await user1ApiContext.post(`/api/conversations/${newConversationId}/confirm-rental`, {
        data: rentalData
      });
      const rental = await expectSuccessfulResponse(rentalResponse, 200);
      createdIds.rentals.push(rental.id);

      // Check conversation status
      const conversationsResponse = await user1ApiContext.get('/api/conversations', {
        headers: addAuthHeaders(user1AuthTokens)
      });
      const conversations = await expectSuccessfulResponse(conversationsResponse);
      const updatedConversation = conversations.find((c: any) => c.id === newConversationId);
      
      expect(updatedConversation.status).toBe('RENTAL_CONFIRMED');
    });

    test('should prevent duplicate rental confirmation', async () => {
      // Try to confirm the same rental again
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      
      const response = await user1ApiContext.post(`/api/conversations/${conversationId}/confirm-rental`, {
        data: rentalData
      });
      
      await expectErrorResponse(response, 400, 'Rental already confirmed for this conversation');
    });
  });

  test.describe('Authorization and Access Control', () => {
    let user1StableId: string;
    let user3ConversationId: string; // Conversation user1 and user2 don't have access to

    test.beforeAll(async () => {
      // Create stable with user1
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      user1StableId = stable.id;
      createdIds.stables.push(user1StableId);

      // Simulate a conversation that belongs to neither user1 nor user2
      // In practice, this would be created by a third user, but for testing we'll use a fake ID
      user3ConversationId = 'fake-conversation-id-for-testing';
    });

    test('should prevent user2 from accessing user1 conversations where user2 is not involved', async () => {
      // This test assumes there might be conversations where user2 is not a participant
      // The endpoint should naturally filter these out, so user2 won't see them
      const response = await user2ApiContext.get('/api/conversations', {
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      const conversations = await expectSuccessfulResponse(response);
      
      // All returned conversations should involve user2 either as rider or stable owner
      conversations.forEach((conversation: any) => {
        const isRider = conversation.rider_id === user2AuthTokens.userId;
        const isStableOwner = conversation.stable?.owner_id === user2AuthTokens.userId;
        expect(isRider || isStableOwner).toBe(true);
      });
    });

    test('should prevent user2 from accessing messages of conversations they are not part of', async () => {
      const response = await user2ApiContext.get(`/api/conversations/${user3ConversationId}/messages`, {
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      await expectErrorResponse(response, 404, 'Conversation not found or access denied');
    });

    test('should prevent user2 from sending messages to conversations they are not part of', async () => {
      const messageData = generateTestMessageData();
      
      const response = await user2ApiContext.post(`/api/conversations/${user3ConversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      await expectErrorResponse(response, 404, 'Conversation not found or access denied');
    });

    test('should prevent unauthorized users from confirming rentals', async () => {
      const rentalData = generateTestRentalConfirmationData(user2AuthTokens.userId);
      
      const response = await user2ApiContext.post(`/api/conversations/${user3ConversationId}/confirm-rental`, {
        data: rentalData
      });
      
      // Should return error for non-existent conversation
      expect([404, 500]).toContain(response.status());
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle conversation creation with non-existent stable', async () => {
      const conversationData = generateTestConversationData('non-existent-stable-id');
      
      const response = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      
      // Should return error for non-existent stable
      expect([400, 404, 500]).toContain(response.status());
    });

    test('should handle rental confirmation with non-existent conversation', async () => {
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      
      const response = await user1ApiContext.post('/api/conversations/non-existent-id/confirm-rental', {
        data: rentalData
      });
      
      await expectErrorResponse(response, 404, 'Conversation not found or access denied');
    });

    test('should handle rental confirmation without box_id', async () => {
      // Create conversation without box
      const stableData = generateTestStableData();
      const stableResponse = await user1ApiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(user1AuthTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const conversationData = generateTestConversationData(stable.id); // No box ID
      const conversationResponse = await user2ApiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(user2AuthTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      // Try to confirm rental for conversation without box
      const rentalData = generateTestRentalConfirmationData(user1AuthTokens.userId);
      
      const response = await user1ApiContext.post(`/api/conversations/${conversation.id}/confirm-rental`, {
        data: rentalData
      });
      
      await expectErrorResponse(response, 400, 'No box associated with this conversation');
    });
  });
});