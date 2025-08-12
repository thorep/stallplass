import { authenticateRequest } from "@/lib/supabase-auth-middleware";
import { updateCustomLog, deleteCustomLog } from "@/services/horse-log-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/horses/{id}/custom-logs/{logId}:
 *   put:
 *     summary: Update a custom log
 *     description: Updates an existing custom log. Only the horse owner can update logs.
 *     tags:
 *       - Horse Custom Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *       - name: logId
 *         in: path
 *         required: true
 *         description: Log ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Log description
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs
 *               imageDescriptions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Descriptions for each image
 *     responses:
 *       200:
 *         description: Custom log updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log or horse not found or access denied
 *   delete:
 *     summary: Delete a custom log
 *     description: Deletes a custom log. Only the horse owner can delete logs.
 *     tags:
 *       - Horse Custom Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *       - name: logId
 *         in: path
 *         required: true
 *         description: Log ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Custom log deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log or horse not found or access denied
 */

/**
 * PUT /api/horses/[id]/custom-logs/[logId]
 * Update a custom log
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { logId } = await params;
    
    if (!logId) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();

    const updateData: {
      description?: string;
      images?: string[];
      imageDescriptions?: string[];
    } = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.imageDescriptions !== undefined) updateData.imageDescriptions = data.imageDescriptions;

    const log = await updateCustomLog(logId, authResult.uid, updateData);
    
    if (!log) {
      return NextResponse.json(
        { error: "Log not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error updating custom log:", error);
    return NextResponse.json(
      { error: "Failed to update custom log" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]/custom-logs/[logId]
 * Delete a custom log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { logId } = await params;
    
    if (!logId) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteCustomLog(logId, authResult.uid);
    
    if (!success) {
      return NextResponse.json(
        { error: "Log not found or access denied" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting custom log:", error);
    return NextResponse.json(
      { error: "Failed to delete custom log" },
      { status: 500 }
    );
  }
}