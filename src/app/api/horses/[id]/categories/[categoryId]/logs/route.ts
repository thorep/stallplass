import { requireAuth } from "@/lib/auth";
import { getCustomLogsByCategoryId, createCustomLog } from "@/services/horse-log-service";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/horses/{id}/categories/{categoryId}/logs:
 *   get:
 *     summary: Get custom logs for a category
 *     description: Retrieves all logs for a specific custom category. Only the horse owner can access the logs.
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
 *       - name: categoryId
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of custom logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   categoryId:
 *                     type: string
 *                   horseId:
 *                     type: string
 *                   profileId:
 *                     type: string
 *                   description:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   imageDescriptions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   profile:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category/horse not found or access denied
 *   post:
 *     summary: Create a new custom log
 *     description: Creates a new log in a custom category. Only the horse owner can create logs.
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
 *             required:
 *               - description
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
 *       201:
 *         description: Custom log created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category/horse not found or access denied
 */

/**
 * GET /api/horses/[id]/categories/[categoryId]/logs
 * Get all logs for a custom category
 */
export async function GET(
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

    const logs = await getCustomLogsByCategoryId(categoryId, user.id);
    
    if (logs === null) {
      return NextResponse.json(
        { error: "Category or horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching custom logs:", error);
    try { const { id, categoryId } = await params; captureApiError({ error, context: 'horse_custom_logs_get', route: '/api/horses/[id]/categories/[categoryId]/logs', method: 'GET', horseId: id, categoryId, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch custom logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses/[id]/categories/[categoryId]/logs
 * Create a new custom log in a category
 */
export async function POST(
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

    if (!data.description || data.description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const log = await createCustomLog(categoryId, user.id, {
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    });
    
    if (!log) {
      return NextResponse.json(
        { error: "Category or horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating custom log:", error);
    try { const { id, categoryId } = await params; captureApiError({ error, context: 'horse_custom_log_create_post', route: '/api/horses/[id]/categories/[categoryId]/logs', method: 'POST', horseId: id, categoryId, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to create custom log" },
      { status: 500 }
    );
  }
}
