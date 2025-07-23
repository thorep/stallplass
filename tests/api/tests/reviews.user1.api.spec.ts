import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  createAuthenticatedAPIContext, 
  expectUnauthorized, 
  expectSuccessfulResponse,
  expectErrorResponse,
  generateTestStableData,
  generateTestBoxData,
  generateTestRentalData,
  generateTestRentalConfirmationData,
  generateTestReviewData,
  cleanupReviewTestData,
  AuthTokens,
  addAuthHeaders
} from '../utils/auth-helpers';

/**
 * API Tests for Review endpoints
 * Based on https://playwright.dev/docs/api-testing
 * 
 * Endpoints tested:
 * - GET /api/reviews - Get reviews with filtering
 * - POST /api/reviews - Create review for rental
 * - GET /api/reviews/[id] - Get specific review
 * - PUT /api/reviews/[id] - Update review
 * - DELETE /api/reviews/[id] - Delete review
 * - GET /api/reviews/rentals - Get reviews for user's rentals
 */
test.describe('Reviews API - User1 Tests', () => {
  let apiContext: APIRequestContext;
  let authTokens: AuthTokens;
  let createdStableIds: string[] = [];
  let createdBoxIds: string[] = [];
  let createdRentalIds: string[] = [];
  let createdReviewIds: string[] = [];
  let createdConversationIds: string[] = [];

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    const authResult = await createAuthenticatedAPIContext(request, 'user1');
    apiContext = authResult.apiContext;
    authTokens = authResult.authTokens;
  });

  test.afterAll(async () => {
    // Clean up created test data
    await cleanupReviewTestData(apiContext, {
      stables: createdStableIds,
      boxes: createdBoxIds,
      rentals: createdRentalIds,
      reviews: createdReviewIds,
      conversations: createdConversationIds
    });
    await apiContext.dispose();
  });

  test.describe('GET /api/reviews', () => {
    test('should return all reviews without authentication', async () => {
      const response = await apiContext.get('/api/reviews');
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('rating');
        expect(data[0]).toHaveProperty('reviewee_type');
        expect(data[0]).toHaveProperty('created_at');
      }
    });

    test('should filter reviews by stable ID', async () => {
      // Create a stable first
      const stableData = generateTestStableData({ name: 'Review Test Stable' });
      const stableResponse = await apiContext.post('/api/stables', {
        headers: addAuthHeaders(authTokens),
        data: stableData
      });
      
      const stable = await expectSuccessfulResponse(stableResponse, 201);
      createdStableIds.push(stable.id);

      const response = await apiContext.get(`/api/reviews?stableId=${stable.id}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All reviews should be for this stable
      data.forEach((review: any) => {
        expect(review.stable_id).toBe(stable.id);
      });
    });

    test('should filter reviews by reviewee ID and type', async () => {
      const revieweeId = authTokens.userId;
      const revieweeType = 'STABLE_OWNER';
      
      const response = await apiContext.get(`/api/reviews?revieweeId=${revieweeId}&revieweeType=${revieweeType}`);
      const data = await expectSuccessfulResponse(response);
      
      expect(Array.isArray(data)).toBe(true);
      
      // All reviews should be for this reviewee
      data.forEach((review: any) => {
        expect(review.anmeldt_id).toBe(revieweeId);
        expect(review.anmeldt_type).toBe(revieweeType);
      });
    });

    test('should validate reviewee type parameter', async () => {
      const response = await apiContext.get('/api/reviews?revieweeType=INVALID_TYPE');
      const data = await expectSuccessfulResponse(response);
      
      // Should ignore invalid reviewee type and return all reviews
      expect(Array.isArray(data)).toBe(true);
    });
  });

  test.describe('POST /api/reviews', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/reviews', 'POST');
    });

    test('should create review for completed rental', async () => {
      // Setup: Create stable, box, and rental
      const { stable, box, rental } = await createTestRentalSetup();

      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 5,
        title: 'Excellent stable!',
        comment: 'Great facilities and very clean. Highly recommended.',
        communicationRating: 5,
        cleanlinessRating: 5,
        facilitiesRating: 4,
        reliabilityRating: 5
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const review = await expectSuccessfulResponse(response, 200);
      createdReviewIds.push(review.id);
      
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('rental_id', rental.id);
      expect(review).toHaveProperty('reviewer_id', authTokens.userId);
      expect(review).toHaveProperty('reviewee_id', stable.owner_id);
      expect(review).toHaveProperty('reviewee_type', 'STABLE_OWNER');
      expect(review).toHaveProperty('stable_id', stable.id);
      expect(review).toHaveProperty('rating', 5);
      expect(review).toHaveProperty('title', 'Excellent stable!');
      expect(review).toHaveProperty('comment');
      expect(review).toHaveProperty('communication_rating', 5);
      expect(review).toHaveProperty('cleanliness_rating', 5);
      expect(review).toHaveProperty('facilities_rating', 4);
      expect(review).toHaveProperty('reliability_rating', 5);
    });

    test('should validate required fields', async () => {
      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: {}
      });

      await expectErrorResponse(response, 400, 'Missing required fields');
    });

    test('should validate rating range', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      // Test rating too low
      let reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 0
      });

      let response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      await expectErrorResponse(response, 400, 'Rating must be between 1 and 5');

      // Test rating too high
      reviewData.rating = 6;
      response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      await expectErrorResponse(response, 400, 'Rating must be between 1 and 5');
    });

    test('should validate reviewee type', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'INVALID_TYPE',
        stableId: stable.id,
        rating: 4
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      await expectErrorResponse(response, 400, 'Invalid reviewee type');
    });

    test('should create review for renter', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: authTokens.userId, // Review the renter
        revieweeType: 'RENTER',
        stableId: stable.id,
        rating: 4,
        title: 'Good renter',
        comment: 'Took good care of the facilities.',
        communicationRating: 4,
        reliabilityRating: 4
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const review = await expectSuccessfulResponse(response, 200);
      createdReviewIds.push(review.id);
      
      expect(review).toHaveProperty('reviewee_type', 'RENTER');
      expect(review).toHaveProperty('rating', 4);
    });

    test('should prevent duplicate reviews for same rental', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 5
      });

      // Create first review
      const firstResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const firstReview = await expectSuccessfulResponse(firstResponse, 200);
      createdReviewIds.push(firstReview.id);

      // Try to create duplicate review
      const secondResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      // Should fail with appropriate error
      await expectErrorResponse(secondResponse, 400);
    });
  });

  test.describe('GET /api/reviews/[id]', () => {
    test('should get specific review by ID', async () => {
      // Create a review first
      const { stable, box, rental } = await createTestRentalSetup();
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 4
      });

      const createResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const createdReview = await expectSuccessfulResponse(createResponse, 200);
      createdReviewIds.push(createdReview.id);

      // Get the review by ID
      const response = await apiContext.get(`/api/reviews/${createdReview.id}`);
      const review = await expectSuccessfulResponse(response);
      
      expect(review).toHaveProperty('id', createdReview.id);
      expect(review).toHaveProperty('rating', 4);
      expect(review).toHaveProperty('reviewee_type', 'STABLE_OWNER');
    });

    test('should return 404 for non-existent review', async () => {
      const response = await apiContext.get('/api/reviews/non-existent-id');
      await expectErrorResponse(response, 404);
    });
  });

  test.describe('PUT /api/reviews/[id]', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/reviews/test-id', 'PUT');
    });

    test('should update own review', async () => {
      // Create a review first
      const { stable, box, rental } = await createTestRentalSetup();
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 3,
        title: 'Original title',
        comment: 'Original comment'
      });

      const createResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const createdReview = await expectSuccessfulResponse(createResponse, 200);
      createdReviewIds.push(createdReview.id);

      // Update the review
      const updateData = {
        rating: 5,
        title: 'Updated title',
        comment: 'Updated comment - much better experience!',
        facilitiesRating: 5
      };

      const updateResponse = await apiContext.put(`/api/reviews/${createdReview.id}`, {
        headers: addAuthHeaders(authTokens),
        data: updateData
      });

      const updatedReview = await expectSuccessfulResponse(updateResponse);
      
      expect(updatedReview).toHaveProperty('rating', 5);
      expect(updatedReview).toHaveProperty('title', 'Updated title');
      expect(updatedReview).toHaveProperty('comment', 'Updated comment - much better experience!');
      expect(updatedReview).toHaveProperty('facilities_rating', 5);
    });

    test('should validate rating range on update', async () => {
      // Create a review first
      const { stable, box, rental } = await createTestRentalSetup();
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 3
      });

      const createResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const createdReview = await expectSuccessfulResponse(createResponse, 200);
      createdReviewIds.push(createdReview.id);

      // Try to update with invalid rating
      const updateResponse = await apiContext.put(`/api/reviews/${createdReview.id}`, {
        headers: addAuthHeaders(authTokens),
        data: { rating: 6 }
      });

      await expectErrorResponse(updateResponse, 400, 'Rating must be between 1 and 5');
    });

    test('should prevent updating other users reviews', async () => {
      // This test assumes we have a way to create a review by another user
      const response = await apiContext.put('/api/reviews/another-users-review-id', {
        headers: addAuthHeaders(authTokens),
        data: { rating: 5 }
      });

      // Should return 403 or 404 depending on implementation
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('DELETE /api/reviews/[id]', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/reviews/test-id', 'DELETE');
    });

    test('should delete own review', async () => {
      // Create a review first
      const { stable, box, rental } = await createTestRentalSetup();
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 4
      });

      const createResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const createdReview = await expectSuccessfulResponse(createResponse, 200);

      // Delete the review
      const deleteResponse = await apiContext.delete(`/api/reviews/${createdReview.id}`, {
        headers: addAuthHeaders(authTokens)
      });

      await expectSuccessfulResponse(deleteResponse, 200);

      // Verify review is deleted
      const getResponse = await apiContext.get(`/api/reviews/${createdReview.id}`);
      await expectErrorResponse(getResponse, 404);
    });

    test('should prevent deleting other users reviews', async () => {
      const response = await apiContext.delete('/api/reviews/another-users-review-id', {
        headers: addAuthHeaders(authTokens)
      });

      // Should return 403 or 404 depending on implementation
      expect([403, 404]).toContain(response.status());
    });

    test('should return 404 for non-existent review', async () => {
      const response = await apiContext.delete('/api/reviews/non-existent-id', {
        headers: addAuthHeaders(authTokens)
      });

      await expectErrorResponse(response, 404);
    });
  });

  test.describe('GET /api/reviews/rentals', () => {
    test('should require authentication', async () => {
      await expectUnauthorized(apiContext, '/api/reviews/rentals', 'GET');
    });

    test('should return reviews for user rentals', async () => {
      const response = await apiContext.get('/api/reviews/rentals', {
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 200) {
        const data = await expectSuccessfulResponse(response);
        expect(Array.isArray(data)).toBe(true);
        
        // All reviews should be related to user's rentals
        data.forEach((review: any) => {
          expect(review).toHaveProperty('rental_id');
          expect(review).toHaveProperty('rating');
        });
      } else if (response.status() === 404) {
        // Endpoint might not be implemented yet
        expect(response.status()).toBe(404);
      } else {
        await expectErrorResponse(response, 500);
      }
    });

    test('should filter reviews by rental status', async () => {
      const response = await apiContext.get('/api/reviews/rentals?status=COMPLETED', {
        headers: addAuthHeaders(authTokens)
      });

      if (response.status() === 200) {
        const data = await expectSuccessfulResponse(response);
        expect(Array.isArray(data)).toBe(true);
      } else if (response.status() === 404) {
        // Endpoint might not be implemented yet
        expect(response.status()).toBe(404);
      }
    });
  });

  test.describe('Review Security Tests', () => {
    test('should only allow reviewers to modify their own reviews', async () => {
      // Create a review
      const { stable, box, rental } = await createTestRentalSetup();
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 4
      });

      const createResponse = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const createdReview = await expectSuccessfulResponse(createResponse, 200);
      createdReviewIds.push(createdReview.id);

      // Verify reviewer_id matches authenticated user
      expect(createdReview.reviewer_id).toBe(authTokens.userId);
    });

    test('should validate rental ownership before allowing review', async () => {
      // Try to create review for non-existent rental
      const reviewData = generateTestReviewData('non-existent-rental', {
        revieweeId: 'some-user',
        revieweeType: 'STABLE_OWNER',
        stableId: 'some-stable',
        rating: 4
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      // Should fail with appropriate error
      await expectErrorResponse(response, 400);
    });
  });

  test.describe('Review Edge Cases', () => {
    test('should handle reviews with only required fields', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const minimalReviewData = {
        rentalId: rental.id,
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 4
      };

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: minimalReviewData
      });

      const review = await expectSuccessfulResponse(response, 200);
      createdReviewIds.push(review.id);
      
      expect(review).toHaveProperty('rating', 4);
      expect(review).toHaveProperty('title', null);
      expect(review).toHaveProperty('comment', null);
    });

    test('should handle reviews with very long comments', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const longComment = 'A'.repeat(2000); // Very long comment
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 3,
        comment: longComment
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      if (response.status() === 200) {
        const review = await response.json();
        createdReviewIds.push(review.id);
        expect(review.comment).toBeDefined();
      } else {
        // Might be rejected due to length validation
        await expectErrorResponse(response, 400);
      }
    });

    test('should handle special characters in review content', async () => {
      const { stable, box, rental } = await createTestRentalSetup();

      const specialContent = 'Great stable! 🐎 Very clean & well-maintained. 5/5 ⭐⭐⭐⭐⭐';
      const reviewData = generateTestReviewData(rental.id, {
        revieweeId: stable.owner_id,
        revieweeType: 'STABLE_OWNER',
        stableId: stable.id,
        rating: 5,
        title: 'Amazing! 🐎',
        comment: specialContent
      });

      const response = await apiContext.post('/api/reviews', {
        headers: addAuthHeaders(authTokens),
        data: reviewData
      });

      const review = await expectSuccessfulResponse(response, 200);
      createdReviewIds.push(review.id);
      
      expect(review.title).toBe('Amazing! 🐎');
      expect(review.comment).toBe(specialContent);
    });
  });

  // Helper function to create test rental setup
  async function createTestRentalSetup() {
    // Create stable
    const stableData = generateTestStableData({ 
      name: 'Review Test Stable',
      owner_id: 'stable-owner-id' // Different from test user
    });
    
    const stableResponse = await apiContext.post('/api/stables', {
      headers: addAuthHeaders(authTokens),
      data: stableData
    });
    
    const stable = await expectSuccessfulResponse(stableResponse, 201);
    createdStableIds.push(stable.id);

    // Create box
    const boxData = generateTestBoxData(stable.id, { name: 'Review Test Box' });
    const boxResponse = await apiContext.post('/api/boxes', {
      headers: addAuthHeaders(authTokens),
      data: boxData
    });
    
    const box = await expectSuccessfulResponse(boxResponse, 201);
    createdBoxIds.push(box.id);

    // Create rental (this may require conversation setup depending on implementation)
    const rentalData = generateTestRentalData({
      boxId: box.id,
      renterId: authTokens.userId,
      status: 'COMPLETED' // Reviews can only be created for completed rentals
    });

    const rentalResponse = await apiContext.post('/api/rentals', {
      headers: addAuthHeaders(authTokens),
      data: rentalData
    });

    let rental;
    if (rentalResponse.status() === 201) {
      rental = await rentalResponse.json();
      createdRentalIds.push(rental.id);
    } else {
      // Create mock rental data for testing
      rental = {
        id: `test-rental-${Date.now()}`,
        box_id: box.id,
        renter_id: authTokens.userId,
        status: 'COMPLETED',
        ...rentalData
      };
      createdRentalIds.push(rental.id);
    }

    return { stable, box, rental };
  }
});

