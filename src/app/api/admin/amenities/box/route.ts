import { createApiLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth";
import {
  createBoxAmenity,
  deleteBoxAmenity,
  getAllBoxAmenities,
  updateBoxAmenity,
} from "@/services/amenity-service";
import { NextRequest, NextResponse } from "next/server";

const apiLogger = createApiLogger({
  endpoint: "/api/admin/amenities/box",
  requestId: crypto.randomUUID(),
});

/**
 * @swagger
 * /api/admin/amenities/box:
 *   get:
 *     summary: Get all box amenities (Admin only)
 *     description: Retrieves all available box amenities that can be assigned to boxes
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Box amenities retrieved successfully
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
 *     summary: Create a new box amenity (Admin only)
 *     description: Creates a new amenity that can be assigned to boxes
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
 *                 description: Name of the box amenity
 *                 example: "Automatic waterer"
 *     responses:
 *       200:
 *         description: Box amenity created successfully
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
 *                   example: "Box amenity with this name already exists"
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a box amenity (Admin only)
 *     description: Updates an existing box amenity
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
 *         description: Box amenity updated successfully
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
 *     summary: Delete a box amenity (Admin only)
 *     description: Deletes an existing box amenity
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
 *         description: Box amenity deleted successfully
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
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const amenities = await getAllBoxAmenities();
    return NextResponse.json(amenities);
  } catch {
    return NextResponse.json({ error: "Failed to fetch box amenities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const amenity = await createBoxAmenity(name);
    return NextResponse.json(amenity);
  } catch (error) {
    apiLogger.error(
      {
        method: "POST",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to create box amenity" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const amenity = await updateBoxAmenity(id, name);
    return NextResponse.json(amenity);
  } catch (error) {
    apiLogger.error(
      {
        method: "PUT",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to update box amenity" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await deleteBoxAmenity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error(
      {
        method: "DELETE",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "API request failed"
    );

    // Handle known errors
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete box amenity" }, { status: 500 });
  }
}
