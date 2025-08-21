import { requireAuth } from "@/lib/auth";
import { getHorseById, updateHorse, deleteHorse } from "@/services/horse-service";
import { UpdateHorseData } from "@/types/horse";
import { NextRequest, NextResponse } from "next/server";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/horses/{id}:
 *   get:
 *     summary: Get a specific horse by ID
 *     description: |
 *       Retrieves a specific horse by its ID. Horse owners and users with whom the horse 
 *       has been shared can access the horse details.
 *     tags:
 *       - Horses
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
 *         description: Horse details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Horse ID
 *                 name:
 *                   type: string
 *                   description: Horse name
 *                 breed:
 *                   type: string
 *                   nullable: true
 *                   description: Horse breed
 *                 age:
 *                   type: integer
 *                   nullable: true
 *                   description: Horse age in years
 *                 gender:
 *                   type: string
 *                   nullable: true
 *                   enum: [STALLION, MARE, GELDING]
 *                   description: Horse gender
 *                 color:
 *                   type: string
 *                   nullable: true
 *                   description: Horse color/coat
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: Additional description
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                   description: Main horse image URL
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *                   description: Profile image URL
 *                 isActive:
 *                   type: boolean
 *                   description: Whether horse is active (not archived)
 *                 isPublic:
 *                   type: boolean
 *                   description: Whether horse profile is publicly visible
 *                 slug:
 *                   type: string
 *                   nullable: true
 *                   description: URL slug for public horse profile
 *                 ownerId:
 *                   type: string
 *                   description: ID of the owner
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "horse123"
 *               name: "Thunder"
 *               breed: "Norsk Fjordhest"
 *               age: 8
 *               gender: "GELDING"
 *               color: "Brun dun"
 *               description: "Rolig og pålitelig ridhest"
 *               imageUrl: "https://example.com/horse1.jpg"
 *               profileImage: "https://example.com/profile1.jpg"
 *               isActive: true
 *               isPublic: true
 *               slug: "thunder-fjordhest"
 *               ownerId: "user456"
 *               createdAt: "2024-01-10T10:00:00Z"
 *               updatedAt: "2024-01-15T12:00:00Z"
 *       400:
 *         description: Bad request - invalid horse ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse ID is required"
 *       404:
 *         description: Horse not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse not found or access denied"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a horse
 *     description: |
 *       Updates an existing horse. Only the horse owner or users with EDIT permissions 
 *       can update horses. All fields are optional - only provided fields will be updated.
 *     tags:
 *       - Horses
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Horse name
 *                 minLength: 1
 *               breed:
 *                 type: string
 *                 nullable: true
 *                 description: Horse breed
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 nullable: true
 *                 description: Horse age in years
 *               gender:
 *                 type: string
 *                 enum: [STALLION, MARE, GELDING]
 *                 nullable: true
 *                 description: Horse gender
 *               color:
 *                 type: string
 *                 nullable: true
 *                 description: Horse color/coat
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Additional description
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Main horse image URL
 *               profileImage:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Profile image URL
 *               isPublic:
 *                 type: boolean
 *                 description: Whether horse profile should be publicly visible
 *               isActive:
 *                 type: boolean
 *                 description: Whether horse is active (not archived)
 *           example:
 *             name: "Thunder Updated"
 *             age: 9
 *             description: "Oppdatert beskrivelse - meget rolig og erfaren ridhest"
 *             isPublic: true
 *     responses:
 *       200:
 *         description: Horse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 breed:
 *                   type: string
 *                   nullable: true
 *                 age:
 *                   type: integer
 *                   nullable: true
 *                 gender:
 *                   type: string
 *                   nullable: true
 *                 color:
 *                   type: string
 *                   nullable: true
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *                 isActive:
 *                   type: boolean
 *                 isPublic:
 *                   type: boolean
 *                 slug:
 *                   type: string
 *                   nullable: true
 *                 ownerId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "horse123"
 *               name: "Thunder Updated"
 *               breed: "Norsk Fjordhest"
 *               age: 9
 *               gender: "GELDING"
 *               color: "Brun dun"
 *               description: "Oppdatert beskrivelse - meget rolig og erfaren ridhest"
 *               isActive: true
 *               isPublic: true
 *               slug: "thunder-fjordhest"
 *               ownerId: "user456"
 *               updatedAt: "2024-01-15T16:30:00Z"
 *       400:
 *         description: Bad request - invalid data or empty horse name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               invalidId:
 *                 value:
 *                   error: "Horse ID is required"
 *               emptyName:
 *                 value:
 *                   error: "Horse name cannot be empty"
 *       404:
 *         description: Horse not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse not found or access denied"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete/archive a horse
 *     description: |
 *       Deletes (archives) a horse. Only the horse owner can delete their horses.
 *       This is typically a soft delete that marks the horse as inactive.
 *     tags:
 *       - Horses
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
 *         description: Horse deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Horse deleted successfully"
 *       400:
 *         description: Bad request - invalid horse ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse ID is required"
 *       404:
 *         description: Horse not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse not found or access denied"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/horses/[id]
 * Get a horse by ID (only owner can access, or if public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const horse = await getHorseById(horseId, user.id);
    
    if (!horse) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(horse);
  } catch (error) {
    console.error("Error fetching horse:", error);
    const { id } = await params;
    captureApiError({ error, context: 'horse_get', route: '/api/horses/[id]', method: 'GET', horseId: id });
    return NextResponse.json(
      { error: "Failed to fetch horse" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/horses/[id]
 * Update a horse (only owner can update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const data: UpdateHorseData = await request.json();

    // Validate name if provided
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Horse name cannot be empty" },
        { status: 400 }
      );
    }

    const horse = await updateHorse(horseId, user.id, data);
    
    if (!horse) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(horse);
  } catch (error) {
    console.error("Error updating horse:", error);
    const { id } = await params;
    captureApiError({ error, context: 'horse_update_put', route: '/api/horses/[id]', method: 'PUT', horseId: id, distinctId: user.id });
    return NextResponse.json(
      { error: "Failed to update horse" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]
 * Delete/archive a horse (only owner can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteHorse(horseId, user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Horse deleted successfully" });
  } catch (error) {
    console.error("Error deleting horse:", error);
    try {
      const { id } = await params;
      captureApiError({ error, context: 'horse_delete', route: '/api/horses/[id]', method: 'DELETE', horseId: id, distinctId: user.id });
    } catch {}
    return NextResponse.json(
      { error: "Failed to delete horse" },
      { status: 500 }
    );
  }
}
