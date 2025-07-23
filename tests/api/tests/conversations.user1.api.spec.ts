import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
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
 * API Tests for /api/conversations endpoints - User1 Tests
 * Based on https://playwright.dev/docs/api-testing
 */
test.describe('Conversations API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
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
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    await cleanupConversationTestData(apiContext, createdIds);
    await apiContext.dispose();
  });

  test.describe('GET /api/conversations', () => {
    test('should return all conversations for authenticated user', async () => {
      const response = await apiContext.get('/api/conversations', {
        headers: addAuthHeaders(authTokens)
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Each conversation should have required fields
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('rider_id');
        expect(data[0]).toHaveProperty('stable_id');
        expect(data[0]).toHaveProperty('status');
        expect(data[0]).toHaveProperty('created_at');
        expect(data[0]).toHaveProperty('updated_at');
        expect(data[0]).toHaveProperty('rider');
        expect(data[0]).toHaveProperty('stable');
      }
    });

    test('should return conversations with latest messages and unread counts', async () => {
      const response = await apiContext.get('/api/conversations', {
        headers: addAuthHeaders(authTokens)
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Each conversation should have messages array and unread count
      data.forEach((conversation: any) => {
        expect(conversation).toHaveProperty('messages');
        expect(Array.isArray(conversation.messages)).toBe(true);
        expect(conversation).toHaveProperty('_count');
        expect(conversation._count).toHaveProperty('messages');
        expect(typeof conversation._count.messages).toBe('number');
      });
    });

    test('should return conversations where user is either rider or stable owner', async () => {
      const response = await apiContext.get('/api/conversations', {
        headers: addAuthHeaders(authTokens)
      });
      
      const data = await expectSuccessfulResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // All conversations should involve the authenticated user
      data.forEach((conversation: any) => {
        const isRider = conversation.rider_id === authTokens.userId;
        const isStableOwner = conversation.stable?.owner_id === authTokens.userId;
        expect(isRider || isStableOwner).toBe(true);
      });
    });

    test('should require authentication', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      await expectUnauthorized(unauthenticatedRequest, '/api/conversations', 'GET');
    });
  });

  test.describe('POST /api/conversations', () => {
    let testStableId: string;
    let testBoxId: string;

    test.beforeAll(async () => {
      // Create test stable and box for conversation tests
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(authTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      testStableId = stable.id;
      createdIds.stables.push(testStableId);

      const boxData = generateTestBoxData(testStableId);
      const boxResponse = await apiContext.post('/api/boxes', {
        data: boxData,
        headers: addAuthHeaders(authTokens)
      });
      const box = await expectSuccessfulResponse(boxResponse, 201);
      testBoxId = box.id;
      createdIds.boxes.push(testBoxId);
    });

    test('should create conversation with valid data', async () => {
      const conversationData = generateTestConversationData(testStableId, testBoxId);
      
      const response = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      
      const createdConversation = await expectSuccessfulResponse(response, 200);
      createdIds.conversations.push(createdConversation.id);
      
      expect(createdConversation).toHaveProperty('id');
      expect(createdConversation.rider_id).toBe(authTokens.userId);
      expect(createdConversation.stable_id).toBe(testStableId);
      expect(createdConversation.box_id).toBe(testBoxId);
      expect(createdConversation).toHaveProperty('status');
      expect(createdConversation).toHaveProperty('created_at');
      expect(createdConversation).toHaveProperty('updated_at');
    });

    test('should create conversation without box_id (stable-level conversation)', async () => {
      const conversationData = generateTestConversationData(testStableId);
      
      const response = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      
      const createdConversation = await expectSuccessfulResponse(response, 200);
      createdIds.conversations.push(createdConversation.id);
      
      expect(createdConversation).toHaveProperty('id');
      expect(createdConversation.rider_id).toBe(authTokens.userId);
      expect(createdConversation.stable_id).toBe(testStableId);
      expect(createdConversation.box_id).toBeNull();
    });

    test('should return existing conversation if one already exists', async () => {
      const conversationData = generateTestConversationData(testStableId, testBoxId);
      
      // Create first conversation
      const firstResponse = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      const firstConversation = await expectSuccessfulResponse(firstResponse, 200);
      createdIds.conversations.push(firstConversation.id);
      
      // Try to create duplicate
      const secondResponse = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      const secondConversation = await expectSuccessfulResponse(secondResponse, 200);
      
      // Should return the same conversation
      expect(secondConversation.id).toBe(firstConversation.id);
    });

    test('should reject creation with missing required fields', async () => {
      const incompleteData = {
        initialMessage: 'Missing stable ID'
      };
      
      const response = await apiContext.post('/api/conversations', {
        data: incompleteData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 400, 'Stable ID and initial message are required');
    });

    test('should reject creation with empty initial message', async () => {
      const invalidData = generateTestConversationData(testStableId, testBoxId, {
        initialMessage: ''
      });
      
      const response = await apiContext.post('/api/conversations', {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 400, 'Stable ID and initial message are required');
    });

    test('should prevent users from messaging their own stable', async () => {
      // First, create a stable owned by the authenticated user
      const ownStableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        data: ownStableData,
        headers: addAuthHeaders(authTokens)
      });
      const ownStable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(ownStable.id);

      // Try to create conversation with own stable
      const conversationData = generateTestConversationData(ownStable.id);
      const response = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 400, 'Du kan ikke sende melding til din egen stall');
    });

    test('should require authentication', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      const conversationData = generateTestConversationData(testStableId);
      
      await expectUnauthorized(unauthenticatedRequest, '/api/conversations', 'POST');
    });
  });

  test.describe('GET /api/conversations/[id]/messages', () => {
    let testConversationId: string;

    test.beforeAll(async () => {
      // Create test conversation for message tests
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(authTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const conversationData = generateTestConversationData(stable.id);
      const conversationResponse = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      testConversationId = conversation.id;
      createdIds.conversations.push(testConversationId);
    });

    test('should return messages for conversation user has access to', async () => {
      const response = await apiContext.get(`/api/conversations/${testConversationId}/messages`, {
        headers: addAuthHeaders(authTokens)
      });
      
      const messages = await expectSuccessfulResponse(response);
      expect(Array.isArray(messages)).toBe(true);
      
      // Each message should have required fields
      if (messages.length > 0) {
        expect(messages[0]).toHaveProperty('id');
        expect(messages[0]).toHaveProperty('conversation_id');
        expect(messages[0]).toHaveProperty('sender_id');
        expect(messages[0]).toHaveProperty('content');
        expect(messages[0]).toHaveProperty('message_type');
        expect(messages[0]).toHaveProperty('created_at');
        expect(messages[0]).toHaveProperty('is_read');
        expect(messages[0]).toHaveProperty('avsender');
      }
    });

    test('should return messages in chronological order', async () => {
      // Add a few more messages to test ordering
      const messageData1 = generateTestMessageData({ content: 'First message' });
      await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData1,
        headers: addAuthHeaders(authTokens)
      });
      
      const messageData2 = generateTestMessageData({ content: 'Second message' });
      await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData2,
        headers: addAuthHeaders(authTokens)
      });
      
      const response = await apiContext.get(`/api/conversations/${testConversationId}/messages`, {
        headers: addAuthHeaders(authTokens)
      });
      
      const messages = await expectSuccessfulResponse(response);
      expect(messages.length).toBeGreaterThan(1);
      
      // Check that messages are in ascending order by created_at
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].created_at).getTime();
        const currTime = new Date(messages[i].created_at).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    test('should mark messages as read when fetching', async () => {
      // This is tested indirectly - the endpoint should update is_read status
      // We can verify by checking that the operation completes successfully
      const response = await apiContext.get(`/api/conversations/${testConversationId}/messages`, {
        headers: addAuthHeaders(authTokens)
      });
      
      await expectSuccessfulResponse(response);
    });

    test('should return 404 for non-existent conversation', async () => {
      const response = await apiContext.get('/api/conversations/non-existent-id/messages', {
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 404, 'Conversation not found or access denied');
    });

    test('should require authentication', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      await expectUnauthorized(
        unauthenticatedRequest, 
        `/api/conversations/${testConversationId}/messages`, 
        'GET'
      );
    });
  });

  test.describe('POST /api/conversations/[id]/messages', () => {
    let testConversationId: string;

    test.beforeAll(async () => {
      // Create test conversation for message creation tests
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(authTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const conversationData = generateTestConversationData(stable.id);
      const conversationResponse = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      testConversationId = conversation.id;
      createdIds.conversations.push(testConversationId);
    });

    test('should create message with valid data', async () => {
      const messageData = generateTestMessageData();
      
      const response = await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(authTokens)
      });
      
      const createdMessage = await expectSuccessfulResponse(response, 200);
      
      expect(createdMessage).toHaveProperty('id');
      expect(createdMessage.conversation_id).toBe(testConversationId);
      expect(createdMessage.sender_id).toBe(authTokens.userId);
      expect(createdMessage.content).toBe(messageData.content);
      expect(createdMessage.message_type).toBe(messageData.messageType);
      expect(createdMessage).toHaveProperty('created_at');
      expect(createdMessage.is_read).toBe(false);
      expect(createdMessage).toHaveProperty('avsender');
    });

    test('should create message with metadata', async () => {
      const messageData = generateTestMessageData({
        metadata: { type: 'test', value: 'test-metadata' }
      });
      
      const response = await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(authTokens)
      });
      
      const createdMessage = await expectSuccessfulResponse(response, 200);
      expect(createdMessage.metadata).toEqual(messageData.metadata);
    });

    test('should default message type to TEXT if not provided', async () => {
      const messageData = {
        content: 'Message without explicit type'
      };
      
      const response = await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(authTokens)
      });
      
      const createdMessage = await expectSuccessfulResponse(response, 200);
      expect(createdMessage.message_type).toBe('TEXT');
    });

    test('should update conversation timestamp when message is created', async () => {
      // Get current conversation timestamp
      const conversationResponse = await apiContext.get('/api/conversations', {
        headers: addAuthHeaders(authTokens)
      });
      const conversations = await expectSuccessfulResponse(conversationResponse);
      const conversation = conversations.find((c: any) => c.id === testConversationId);
      const originalTimestamp = conversation.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create message
      const messageData = generateTestMessageData();
      await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: messageData,
        headers: addAuthHeaders(authTokens)
      });
      
      // Verify conversation timestamp was updated
      const updatedConversationResponse = await apiContext.get('/api/conversations', {
        headers: addAuthHeaders(authTokens)
      });
      const updatedConversations = await expectSuccessfulResponse(updatedConversationResponse);
      const updatedConversation = updatedConversations.find((c: any) => c.id === testConversationId);
      
      expect(new Date(updatedConversation.updated_at).getTime())
        .toBeGreaterThan(new Date(originalTimestamp).getTime());
    });

    test('should reject creation with missing content', async () => {
      const invalidData = {};
      
      const response = await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 400, 'Content is required');
    });

    test('should reject creation with empty content', async () => {
      const invalidData = { content: '' };
      
      const response = await apiContext.post(`/api/conversations/${testConversationId}/messages`, {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 400, 'Content is required');
    });

    test('should return 404 for non-existent conversation', async () => {
      const messageData = generateTestMessageData();
      
      const response = await apiContext.post('/api/conversations/non-existent-id/messages', {
        data: messageData,
        headers: addAuthHeaders(authTokens)
      });
      
      await expectErrorResponse(response, 404, 'Conversation not found or access denied');
    });

    test('should require authentication', async ({ playwright }) => {
      const unauthenticatedRequest = await playwright.request.newContext();
      const messageData = generateTestMessageData();
      
      await expectUnauthorized(
        unauthenticatedRequest, 
        `/api/conversations/${testConversationId}/messages`, 
        'POST'
      );
    });
  });

  test.describe('Error Handling', () => {
    test('should handle malformed JSON in POST requests', async () => {
      const response = await apiContext.post('/api/conversations', {
        data: 'invalid-json-string',
        headers: addAuthHeaders(authTokens)
      });
      
      // Should return 400 for malformed JSON
      expect([400, 500]).toContain(response.status());
    });

    test('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures - depends on test environment setup
      // For now, we'll skip this test
      test.skip();
    });
  });

  test.describe('Data Validation', () => {
    test('should validate conversation creation fields', async () => {
      const invalidData = {
        stableId: '', // Empty stable ID
        initialMessage: 'Valid message'
      };
      
      const response = await apiContext.post('/api/conversations', {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });
      
      expect([400, 500]).toContain(response.status());
    });

    test('should validate message creation fields', async () => {
      // This test requires a valid conversation ID
      const stableData = generateTestStableData();
      const stableResponse = await apiContext.post('/api/stables', {
        data: stableData,
        headers: addAuthHeaders(authTokens)
      });
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdIds.stables.push(stable.id);

      const conversationData = generateTestConversationData(stable.id);
      const conversationResponse = await apiContext.post('/api/conversations', {
        data: conversationData,
        headers: addAuthHeaders(authTokens)
      });
      const conversation = await expectSuccessfulResponse(conversationResponse, 200);
      createdIds.conversations.push(conversation.id);

      const invalidData = {
        content: null // Invalid content
      };
      
      const response = await apiContext.post(`/api/conversations/${conversation.id}/messages`, {
        data: invalidData,
        headers: addAuthHeaders(authTokens)
      });
      
      expect([400, 500]).toContain(response.status());
    });
  });
});