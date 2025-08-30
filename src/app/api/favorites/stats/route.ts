import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/services/prisma';

/**
 * @swagger
 * /api/favorites/stats:
 *   get:
 *     summary: Get favorite statistics for user's listings
 *     description: Retrieve favorite counts for all listings owned by the authenticated user
 *     tags: [Favorites, Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     stables:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each stable ID
 *                     boxes:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each box ID
 *                     services:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each service ID
 *                     partLoanHorses:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each part-loan horse ID
 *                     horseSales:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each horse sale ID
 *                     horseBuys:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         description: Number of favorites for each horse buy ID
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

    // Get all user's listings
    const [stables, boxes, services, partLoanHorses, horseSales, horseBuys] = await Promise.all([
      prisma.stables.findMany({
        where: { ownerId: user.id },
        select: { id: true }
      }),
      prisma.boxes.findMany({
        where: { stables: { ownerId: user.id } },
        select: { id: true }
      }),
      prisma.services.findMany({
        where: { userId: user.id },
        select: { id: true }
      }),
      prisma.part_loan_horses.findMany({
        where: { userId: user.id },
        select: { id: true }
      }),
      prisma.horse_sales.findMany({
        where: { userId: user.id },
        select: { id: true }
      }),
      prisma.horse_buys.findMany({
        where: { userId: user.id },
        select: { id: true }
      })
    ]);

    // Extract IDs
    const stableIds = stables.map(s => s.id);
    const boxIds = boxes.map(b => b.id);
    const serviceIds = services.map(s => s.id);
    const partLoanHorseIds = partLoanHorses.map(p => p.id);
    const horseSaleIds = horseSales.map(h => h.id);
    const horseBuyIds = horseBuys.map(h => h.id);

    // Get favorite counts for each type
    const [stableFavorites, boxFavorites, serviceFavorites, partLoanHorseFavorites, horseSaleFavorites, horseBuyFavorites] = await Promise.all([
      stableIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'STABLE',
          entityId: { in: stableIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([]),

      boxIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'BOX',
          entityId: { in: boxIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([]),

      serviceIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'SERVICE',
          entityId: { in: serviceIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([]),

      partLoanHorseIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'PART_LOAN_HORSE',
          entityId: { in: partLoanHorseIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([]),

      horseSaleIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'HORSE_SALE',
          entityId: { in: horseSaleIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([]),

      horseBuyIds.length > 0 ? prisma.favorites.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'HORSE_BUY',
          entityId: { in: horseBuyIds }
        },
        _count: { entityId: true }
      }) : Promise.resolve([])
    ]);

    // Convert to object format
    const stats = {
      stables: Object.fromEntries(stableFavorites.map(f => [f.entityId, f._count.entityId])),
      boxes: Object.fromEntries(boxFavorites.map(f => [f.entityId, f._count.entityId])),
      services: Object.fromEntries(serviceFavorites.map(f => [f.entityId, f._count.entityId])),
      partLoanHorses: Object.fromEntries(partLoanHorseFavorites.map(f => [f.entityId, f._count.entityId])),
      horseSales: Object.fromEntries(horseSaleFavorites.map(f => [f.entityId, f._count.entityId])),
      horseBuys: Object.fromEntries(horseBuyFavorites.map(f => [f.entityId, f._count.entityId]))
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error getting favorite stats:', error);
    return NextResponse.json(
      { error: 'Failed to get favorite statistics' },
      { status: 500 }
    );
  }
}