import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { addFavoriteStable, removeFavoriteStable, getUserFavoriteStables } from '@/services/profile-service';
import { z } from 'zod';

// Validation schema for adding/removing favorite
const favoriteStableSchema = z.object({
  stableId: z.string().refine((val) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  }, { message: 'Invalid stable ID format' })
});

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get user's favorite stables
 *     description: Retrieve all stables that the authenticated user has marked as favorites
 *     tags: [Users, Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorite stables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favoriteStables:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                     description: Stable ID
 *             example:
 *               favouriteStables:
 *                 - "123e4567-e89b-12d3-a456-426614174000"
 *                 - "123e4567-e89b-12d3-a456-426614174001"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Add stable to favorites
 *     description: Add a stable to the authenticated user's favorite stables list
 *     tags: [Users, Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stableId
 *             properties:
 *               stableId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the stable to add to favorites
 *           example:
 *             stableId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Stable added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stable added to favorites"
 *                 favoriteStables:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Updated list of favorite stable IDs
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid stable ID format"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Stable not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Remove stable from favorites
 *     description: Remove a stable from the authenticated user's favorite stables list
 *     tags: [Users, Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stableId
 *             properties:
 *               stableId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the stable to remove from favorites
 *           example:
 *             stableId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Stable removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stable removed from favorites"
 *                 favoriteStables:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Updated list of favorite stable IDs
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid stable ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const GET = withAuth(async (request: NextRequest, { profileId }) => {
  try {
    const favoriteStables = await getUserFavoriteStables(profileId);
    return NextResponse.json({ favoriteStables });
  } catch (error) {
    console.error('Error getting user favorite stables:', error);
    return NextResponse.json(
      { error: 'Failed to get favorite stables' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, { profileId }) => {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = favoriteStableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { stableId } = validationResult.data;

    // Add stable to favorites
    const favoriteStables = await addFavoriteStable(profileId, stableId);

    return NextResponse.json({ 
      message: 'Stable added to favorites',
      favoriteStables 
    });
  } catch (error) {
    console.error('Error adding stable to favorites:', error);
    
    // Handle specific errors
    if (error instanceof Error && error.message === 'Stable not found') {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Error && error.message === 'Stable already in favorites') {
      return NextResponse.json(
        { error: 'Stable is already in your favorites' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add stable to favorites' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, { profileId }) => {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = favoriteStableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { stableId } = validationResult.data;

    // Remove stable from favorites
    const favoriteStables = await removeFavoriteStable(profileId, stableId);

    return NextResponse.json({ 
      message: 'Stable removed from favorites',
      favoriteStables 
    });
  } catch (error) {
    console.error('Error removing stable from favorites:', error);
    
    if (error instanceof Error && error.message === 'Stable not in favorites') {
      return NextResponse.json(
        { error: 'Stable is not in your favorites' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove stable from favorites' },
      { status: 500 }
    );
  }
});