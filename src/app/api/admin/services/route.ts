import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { getPostHogServer } from '@/lib/posthog-server';

/**
 * @swagger
 * /api/admin/services:
 *   get:
 *     summary: Get all services including archived (Admin only)
 *     description: Retrieves all services in the system including archived ones, with detailed provider and area information
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Service ID
 *                   title:
 *                     type: string
 *                     description: Service title
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     description: Service description
 *                   archived:
 *                     type: boolean
 *                     description: Whether the service is archived
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Service creation date
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Service last update date
 *                   profiles:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Service provider profile ID
 *                       nickname:
 *                         type: string
 *                         nullable: true
 *                         description: Provider nickname
 *                       phone:
 *                         type: string
 *                         nullable: true
 *                         description: Provider phone number
 *                       firstname:
 *                         type: string
 *                         nullable: true
 *                         description: Provider first name
 *                       lastname:
 *                         type: string
 *                         nullable: true
 *                         description: Provider last name
 *                   service_types:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Service type ID
 *                       name:
 *                         type: string
 *                         description: Service type name
 *                       displayName:
 *                         type: string
 *                         description: Service type display name
 *                   service_areas:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Service area ID
 *                         county:
 *                           type: string
 *                           description: County name
 *                         municipality:
 *                           type: string
 *                           nullable: true
 *                           description: Municipality name
 *                   _count:
 *                     type: object
 *                     properties:
 *                       service_areas:
 *                         type: number
 *                         description: Number of service areas covered
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch services"
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const services = await prisma.services.findMany({
      include: {
        profiles: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            firstname: true,
            lastname: true
          }
        },
        service_types: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        service_areas: {
          select: {
            id: true,
            county: true,
            municipality: true
          }
        },
        _count: {
          select: {
            service_areas: true
          }
        }
      },
      orderBy: [
        { archived: 'asc' }, // Show active services first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching admin services:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'admin_services_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
