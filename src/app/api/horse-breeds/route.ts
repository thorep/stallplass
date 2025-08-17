import { NextResponse } from 'next/server';
import { getActiveHorseBreeds } from '@/services/horse-breed-service';

/**
 * @swagger
 * /api/horse-breeds:
 *   get:
 *     summary: Get all active horse breeds
 *     description: Retrieves all active horse breeds for public use (forms, filters, etc.)
 *     tags: [Horse Breeds]
 *     responses:
 *       200:
 *         description: Active horse breeds retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Horse breed ID
 *                       name:
 *                         type: string
 *                         description: Horse breed name
 *                       isActive:
 *                         type: boolean
 *                         description: Whether the breed is active
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Failed to fetch horse breeds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch horse breeds"
 */
export async function GET() {
  try {
    const breeds = await getActiveHorseBreeds();
    return NextResponse.json({ data: breeds });
  } catch (error) {
    console.error('Error fetching horse breeds:', error);
    return NextResponse.json({ error: 'Failed to fetch horse breeds' }, { status: 500 });
  }
}