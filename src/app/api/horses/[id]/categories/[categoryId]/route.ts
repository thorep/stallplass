import { requireAuth } from "@/lib/auth";
import { updateCustomCategory, deleteCustomCategory } from "@/services/horse-log-service";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/horses/{id}/categories/{categoryId}:
 *   put:
 *     summary: Update a custom log category
 *     description: Updates an existing custom log category. Only the horse owner can update categories.
 *     tags:
 *       - Horse Custom Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               icon:
 *                 type: string
 *                 description: Icon identifier
 *               color:
 *                 type: string
 *                 description: Color theme
 *               isActive:
 *                 type: boolean
 *                 description: Whether category is active
 *               sortOrder:
 *                 type: number
 *                 description: Sort order for category
 *     responses:
 *       200:
 *         description: Custom category updated successfully
 *       400:
 *         description: Bad request (invalid data or category name already exists)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category or horse not found or access denied
 *   delete:
 *     summary: Delete a custom log category
 *     description: Deletes a custom log category and all associated logs. Only the horse owner can delete categories.
 *     tags:
 *       - Horse Custom Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Custom category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category or horse not found or access denied
 */

/**
 * PUT /api/horses/[id]/categories/[categoryId]
 * Update a custom log category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { categoryId } = await params;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validate name length if provided
    if (data.name && data.name.trim().length > 50) {
      return NextResponse.json(
        { error: "Category name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    const updateData: { 
      name?: string; 
      description?: string;
      icon?: string;
      color?: string;
      isActive?: boolean;
      sortOrder?: number;
    } = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || undefined;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const category = await updateCustomCategory(categoryId, user.id, updateData);
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating custom category:", error);
    try { const { id, categoryId } = await params; captureApiError({ error, context: 'horse_custom_category_update_put', route: '/api/horses/[id]/categories/[categoryId]', method: 'PUT', horseId: id, categoryId, distinctId: user.id }); } catch {}
    
    if (error instanceof Error && error.message.includes('Category name already exists')) {
      return NextResponse.json(
        { error: "Category name already exists for this horse" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update custom category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]/categories/[categoryId]
 * Delete a custom log category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { categoryId } = await params;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteCustomCategory(categoryId, user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting custom category:", error);
    try { const { id, categoryId } = await params; captureApiError({ error, context: 'horse_custom_category_delete', route: '/api/horses/[id]/categories/[categoryId]', method: 'DELETE', horseId: id, categoryId, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to delete custom category" },
      { status: 500 }
    );
  }
}
