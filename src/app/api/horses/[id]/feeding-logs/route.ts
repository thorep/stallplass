import { authenticateRequest } from "@/lib/supabase-auth-middleware";
import { getFeedingLogsByHorseId, createFeedingLog } from "@/services/horse-log-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/horses/{id}/feeding-logs:
 *   get:
 *     summary: Get feeding logs for a horse
 *     description: Retrieves all feeding logs for a specific horse. Only the horse owner can access the logs.
 *     tags:
 *       - Horse Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of feeding logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
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
 *         description: Horse not found or access denied
 *   post:
 *     summary: Create a new feeding log
 *     description: Creates a new feeding log for a horse. Only the horse owner can create logs.
 *     tags:
 *       - Horse Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
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
 *                 description: Feeding log description
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
 *         description: Feeding log created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Horse not found or access denied
 */

/**
 * GET /api/horses/[id]/feeding-logs
 * Get all feeding logs for a horse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const logs = await getFeedingLogsByHorseId(horseId, authResult.uid);
    
    if (logs === null) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching feeding logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeding logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses/[id]/feeding-logs
 * Create a new feeding log for a horse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
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

    const log = await createFeedingLog(horseId, authResult.uid, data.categoryId, {
      description: data.description,
      images: data.images || [],
      imageDescriptions: data.imageDescriptions || [],
    });
    
    if (!log) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating feeding log:", error);
    return NextResponse.json(
      { error: "Failed to create feeding log" },
      { status: 500 }
    );
  }
}