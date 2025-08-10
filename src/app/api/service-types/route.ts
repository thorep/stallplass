import { NextResponse } from 'next/server';
import { getActiveServiceTypes } from '@/services/service-type-service';

/**
 * @swagger
 * /api/service-types:
 *   get:
 *     summary: Get all active service types
 *     description: Retrieves all active service types for filtering and form options
 *     tags: [Service Types]
 *     responses:
 *       200:
 *         description: Active service types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Service type ID
 *                   name:
 *                     type: string
 *                     description: Service type name (internal identifier)
 *                   displayName:
 *                     type: string
 *                     description: Service type display name (user-facing)
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the service type is active
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const serviceTypes = await getActiveServiceTypes();
    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error('Failed to fetch service types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service types' },
      { status: 500 }
    );
  }
}