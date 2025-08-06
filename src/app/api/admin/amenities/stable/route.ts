import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { createApiLogger } from '@/lib/logger';
import { 
  getAllStableAmenities, 
  createStableAmenity, 
  updateStableAmenity, 
  deleteStableAmenity 
} from '@/services/amenity-service';

/**
 * @swagger
 * /api/admin/amenities/stable:
 *   get:
 *     summary: Get all stable amenities (Admin only)
 *     description: Retrieves all available stable amenities that can be assigned to stables
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stable amenities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Amenity ID
 *                   name:
 *                     type: string
 *                     description: Amenity name
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
 *     summary: Create a new stable amenity (Admin only)
 *     description: Creates a new amenity that can be assigned to stables
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Name of the stable amenity
 *                 example: "Indoor arena"
 *     responses:
 *       200:
 *         description: Stable amenity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
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
 *         description: Conflict - Amenity already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Stable amenity with this name already exists"
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a stable amenity (Admin only)
 *     description: Updates an existing stable amenity
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
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 description: Amenity ID to update
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: New name for the amenity
 *     responses:
 *       200:
 *         description: Stable amenity updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Amenity not found
 *       409:
 *         description: Conflict - Amenity name already exists
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a stable amenity (Admin only)
 *     description: Deletes an existing stable amenity
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Amenity ID to delete
 *     responses:
 *       200:
 *         description: Stable amenity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required ID parameter
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Amenity not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const amenities = await getAllStableAmenities();
    return NextResponse.json(amenities);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stable amenities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const amenity = await createStableAmenity(name);
    return NextResponse.json(amenity);
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/amenities/stable',
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
      { error: 'Failed to create stable amenity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, name } = body;
    
    if (!id || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }
    
    const amenity = await updateStableAmenity(id, name);
    return NextResponse.json(amenity);
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/amenities/stable',
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
    
    return NextResponse.json(
      { error: 'Failed to update stable amenity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    await deleteStableAmenity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/amenities/stable',
      method: 'DELETE',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'API request failed');
    
    
    // Handle known errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete stable amenity' },
      { status: 500 }
    );
  }
}