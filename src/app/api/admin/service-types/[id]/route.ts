import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createApiLogger } from '@/lib/logger';
import { 
  updateServiceType, 
  deleteServiceType,
  getServiceTypeById 
} from '@/services/service-type-service';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/admin/service-types/{id}:
 *   get:
 *     summary: Get a specific service type (Admin only)
 *     description: Retrieves a single service type by its ID
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service type ID
 *     responses:
 *       200:
 *         description: Service type retrieved successfully
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
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Service type not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a service type (Admin only)
 *     description: Updates an existing service type
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service type ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Internal name for the service type
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 description: User-facing display name
 *               isActive:
 *                 type: boolean
 *                 description: Whether the service type is active
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Service type updated successfully
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
 *                   example: "At least one field must be provided"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Service type not found
 *       409:
 *         description: Conflict - Service type name already exists
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a service type (Admin only)
 *     description: Deletes an existing service type. Cannot delete service types that are in use by existing services.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service type ID to delete
 *     responses:
 *       200:
 *         description: Service type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Service type not found
 *       409:
 *         description: Conflict - Cannot delete service type in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cannot delete service type that is in use"
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const serviceType = await getServiceTypeById(id);
    
    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(serviceType);
  } catch (error) {
    try { const { id } = await params; captureApiError({ error, context: 'admin_service_type_get', route: '/api/admin/service-types/[id]', method: 'GET', id }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch service type' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id } = await params;
    const { name, displayName, isActive } = body;
    
    // Validate at least one field is provided
    if (name === undefined && displayName === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name, displayName, isActive) must be provided' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate displayName if provided
    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json(
        { error: 'Display name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }
    
    const serviceType = await updateServiceType(id, {
      name: name !== undefined ? name.trim() : undefined,
      displayName: displayName !== undefined ? displayName.trim() : undefined,
      isActive
    });
    
    return NextResponse.json(serviceType);
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/service-types/:id',
      method: 'PUT',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    try { const { id } = await params; captureApiError({ error, context: 'admin_service_type_put', route: '/api/admin/service-types/[id]', method: 'PUT', id }); } catch {}
    return NextResponse.json(
      { error: 'Failed to update service type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    await deleteServiceType(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/service-types/:id',
      method: 'DELETE',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Cannot delete service type')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    try { const { id } = await params; captureApiError({ error, context: 'admin_service_type_delete', route: '/api/admin/service-types/[id]', method: 'DELETE', id }); } catch {}
    return NextResponse.json(
      { error: 'Failed to delete service type' },
      { status: 500 }
    );
  }
}
