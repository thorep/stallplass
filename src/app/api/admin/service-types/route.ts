import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createApiLogger } from '@/lib/logger';
import { 
  getAllServiceTypes, 
  createServiceType 
} from '@/services/service-type-service';

/**
 * @swagger
 * /api/admin/service-types:
 *   get:
 *     summary: Get all service types (Admin only)
 *     description: Retrieves all available service types that can be assigned to services
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Service types retrieved successfully
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
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new service type (Admin only)
 *     description: Creates a new service type that can be assigned to services
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Internal name for the service type
 *                 example: "veterinarian"
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 description: User-facing display name
 *                 example: "Veterinarian"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the service type is active
 *     responses:
 *       200:
 *         description: Service type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Name is required"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: Conflict - Service type already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service type with this name already exists"
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const serviceTypes = await getAllServiceTypes();
    return NextResponse.json(serviceTypes);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name, displayName, isActive } = body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }
    
    const serviceType = await createServiceType({
      name: name.trim(),
      displayName: displayName.trim(),
      isActive: isActive ?? true
    });
    
    return NextResponse.json(serviceType);
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/service-types',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create service type' },
      { status: 500 }
    );
  }
}