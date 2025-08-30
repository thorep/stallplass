import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';
import { prisma } from '@/services/prisma';

// Validation schema for adding/removing favorite
const favoriteSchema = z.object({
  entityType: z.enum(['STABLE', 'BOX', 'SERVICE', 'PART_LOAN_HORSE', 'HORSE_SALE', 'HORSE_BUY']),
  entityId: z.string().refine((val) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  }, { message: 'Invalid entity ID format' })
});

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user's favorites
 *     description: Retrieve all favorites for the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       entityType:
 *                         type: string
 *                         enum: [STABLE, BOX, SERVICE, PART_LOAN_HORSE, HORSE_SALE, HORSE_BUY]
 *                       entityId:
 *                         type: string
 *                         format: uuid
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add item to favorites
 *     description: Add an item to the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [STABLE, BOX, SERVICE, PART_LOAN_HORSE, HORSE_SALE, HORSE_BUY]
 *               entityId:
 *                 type: string
 *                 format: uuid
 *           example:
 *             entityType: "BOX"
 *             entityId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Item added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item added to favorites"
 *                 favorite:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data or item already in favorites
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove item from favorites
 *     description: Remove an item from the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [STABLE, BOX, SERVICE, PART_LOAN_HORSE, HORSE_SALE, HORSE_BUY]
 *               entityId:
 *                 type: string
 *                 format: uuid
 *           example:
 *             entityType: "BOX"
 *             entityId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Item removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item removed from favorites"
 *       400:
 *         description: Invalid request data or item not in favorites
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Internal server error
 */

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const favorites = await prisma.favorites.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error getting user favorites:', error);
    try { captureApiError({ error, context: 'favorites_list_get', route: '/api/favorites', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await request.json();

    // Validate request body
    const validationResult = favoriteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { entityType, entityId } = validationResult.data;

    // Check if entity exists based on type
    let entityExists = false;
    switch (entityType) {
      case 'STABLE':
        const stable = await prisma.stables.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!stable;
        break;
      case 'BOX':
        const box = await prisma.boxes.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!box;
        break;
      case 'SERVICE':
        const service = await prisma.services.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!service;
        break;
      case 'PART_LOAN_HORSE':
        const partLoanHorse = await prisma.part_loan_horses.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!partLoanHorse;
        break;
      case 'HORSE_SALE':
        const horseSale = await prisma.horse_sales.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!horseSale;
        break;
      case 'HORSE_BUY':
        const horseBuy = await prisma.horse_buys.findUnique({
          where: { id: entityId },
          select: { id: true }
        });
        entityExists = !!horseBuy;
        break;
    }

    if (!entityExists) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Add to favorites (upsert handles duplicates gracefully)
    const favorite = await prisma.favorites.upsert({
      where: {
        userId_entityType_entityId: {
          userId: user.id,
          entityType,
          entityId
        }
      },
      update: {}, // No updates needed, just ensure it exists
      create: {
        userId: user.id,
        entityType,
        entityId
      }
    });

    return NextResponse.json({
      message: 'Item added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding item to favorites:', error);

    try { captureApiError({ error, context: 'favorite_add_post', route: '/api/favorites', method: 'POST' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to add item to favorites' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await request.json();

    // Validate request body
    const validationResult = favoriteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { entityType, entityId } = validationResult.data;

    // Check if in favorites
    const existingFavorite = await prisma.favorites.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: user.id,
          entityType,
          entityId
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Item is not in your favorites' },
        { status: 400 }
      );
    }

    // Remove from favorites
    await prisma.favorites.delete({
      where: { id: existingFavorite.id }
    });

    return NextResponse.json({
      message: 'Item removed from favorites'
    });
  } catch (error) {
    console.error('Error removing item from favorites:', error);

    try { captureApiError({ error, context: 'favorite_remove_delete', route: '/api/favorites', method: 'DELETE' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to remove item from favorites' },
      { status: 500 }
    );
  }
}