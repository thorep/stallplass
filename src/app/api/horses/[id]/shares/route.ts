import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { shareHorse, unshareHorse, getHorseShares } from "@/services/horse-service";
import { z } from "zod";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

// Validation schema for sharing a horse
const shareHorseSchema = z.object({
  sharedWithId: z.string().min(1, "User ID is required"),
  permissions: z.array(z.enum(["VIEW", "EDIT", "ADD_LOGS"])).optional().default(["VIEW", "EDIT", "ADD_LOGS"])
});

// Validation schema for unsharing a horse
const unshareHorseSchema = z.object({
  sharedWithId: z.string().min(1, "User ID is required")
});

/**
 * @swagger
 * /api/horses/{id}/shares:
 *   get:
 *     summary: Get all users who have access to a horse
 *     description: |
 *       Retrieves all users who have been granted access to a specific horse.
 *       Only the horse owner can view the share list.
 *     tags:
 *       - Horse Shares
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *           example: "horse123"
 *     responses:
 *       200:
 *         description: List of users with access to the horse
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shares:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Share record ID
 *                       horseId:
 *                         type: string
 *                         description: Horse ID
 *                       sharedWithId:
 *                         type: string
 *                         description: ID of user with access
 *                       sharedById:
 *                         type: string
 *                         description: ID of user who granted access
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [VIEW, EDIT, ADD_LOGS]
 *                         description: Granted permissions
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       sharedWith:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nickname:
 *                             type: string
 *                           firstname:
 *                             type: string
 *                             nullable: true
 *                           lastname:
 *                             type: string
 *                             nullable: true
 *             example:
 *               shares:
 *                 - id: "share123"
 *                   horseId: "horse123"
 *                   sharedWithId: "user456"
 *                   sharedById: "owner789"
 *                   permissions: ["VIEW", "EDIT", "ADD_LOGS"]
 *                   createdAt: "2024-01-15T10:00:00Z"
 *                   sharedWith:
 *                     id: "user456"
 *                     nickname: "OleH"
 *                     firstname: "Ole"
 *                     lastname: "Hansen"
 *       400:
 *         description: Bad request - invalid horse ID
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       403:
 *         description: Forbidden - not the horse owner
 *       404:
 *         description: Horse not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Share a horse with another user
 *     description: |
 *       Grants access to a horse to another user with specified permissions.
 *       Only the horse owner can share their horses.
 *       Default permissions are VIEW, EDIT, and ADD_LOGS.
 *     tags:
 *       - Horse Shares
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *           example: "horse123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sharedWithId
 *             properties:
 *               sharedWithId:
 *                 type: string
 *                 description: ID of the user to share the horse with
 *                 example: "user456"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [VIEW, EDIT, ADD_LOGS]
 *                 description: Permissions to grant (defaults to all permissions)
 *                 default: ["VIEW", "EDIT", "ADD_LOGS"]
 *                 example: ["VIEW", "EDIT"]
 *           example:
 *             sharedWithId: "user456"
 *             permissions: ["VIEW", "EDIT", "ADD_LOGS"]
 *     responses:
 *       201:
 *         description: Horse shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Share record ID
 *                 horseId:
 *                   type: string
 *                   description: Horse ID
 *                 sharedWithId:
 *                   type: string
 *                   description: ID of user with access
 *                 sharedById:
 *                   type: string
 *                   description: ID of user who granted access
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Granted permissions
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "share123"
 *               horseId: "horse123"
 *               sharedWithId: "user456"
 *               sharedById: "owner789"
 *               permissions: ["VIEW", "EDIT", "ADD_LOGS"]
 *               createdAt: "2024-01-15T10:00:00Z"
 *               updatedAt: "2024-01-15T10:00:00Z"
 *       400:
 *         description: Bad request - invalid data or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               userNotFound:
 *                 value:
 *                   error: "User not found"
 *               invalidData:
 *                 value:
 *                   error: "User ID is required"
 *               alreadyShared:
 *                 value:
 *                   error: "Horse is already shared with this user"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       403:
 *         description: Forbidden - not the horse owner
 *       404:
 *         description: Horse not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove access to a horse from a user
 *     description: |
 *       Removes access to a horse from a specific user.
 *       Only the horse owner can unshare their horses.
 *     tags:
 *       - Horse Shares
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Horse ID
 *         schema:
 *           type: string
 *           example: "horse123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sharedWithId
 *             properties:
 *               sharedWithId:
 *                 type: string
 *                 description: ID of the user to remove access from
 *                 example: "user456"
 *           example:
 *             sharedWithId: "user456"
 *     responses:
 *       200:
 *         description: Access removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Horse access removed successfully"
 *       400:
 *         description: Bad request - invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       403:
 *         description: Forbidden - not the horse owner
 *       404:
 *         description: Horse not found or share does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse not found or share does not exist"
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/horses/[id]/shares
 * Get all users who have access to a horse (only owner can view)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const shares = await getHorseShares(horseId, user.id);
    
    if (shares === null) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Error fetching horse shares:", error);
    try { const { id } = await params; captureApiError({ error, context: 'horse_shares_get', route: '/api/horses/[id]/shares', method: 'GET', horseId: id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch horse shares" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses/[id]/shares
 * Share a horse with another user (only owner can share)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = shareHorseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { sharedWithId, permissions } = validationResult.data;

    const horseShare = await shareHorse(horseId, user.id, sharedWithId, permissions);
    
    if (!horseShare) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(horseShare, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: "User not found" },
          { status: 400 }
        );
      }
      
      // Handle unique constraint violation (horse already shared with user)
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "Horse is already shared with this user" },
          { status: 400 }
        );
      }
    }

    console.error("Error sharing horse:", error);
    try { const { id } = await params; captureApiError({ error, context: 'horse_share_post', route: '/api/horses/[id]/shares', method: 'POST', horseId: id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to share horse" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]/shares
 * Remove access to a horse from a user (only owner can unshare)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = unshareHorseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { sharedWithId } = validationResult.data;

    const success = await unshareHorse(horseId, user.id, sharedWithId);
    
    if (!success) {
      return NextResponse.json(
        { error: "Horse not found or share does not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Horse access removed successfully" });
  } catch (error) {
    console.error("Error unsharing horse:", error);
    try { const { id } = await params; captureApiError({ error, context: 'horse_share_delete', route: '/api/horses/[id]/shares', method: 'DELETE', horseId: id, distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to remove horse access" },
      { status: 500 }
    );
  }
}
