import { requireAuth } from "@/lib/auth";
import { getCustomCategoriesByHorseId, createCustomCategory } from "@/services/horse-log-service";
import { NextRequest, NextResponse } from "next/server";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/horses/{id}/categories:
 *   get:
 *     summary: Get custom log categories for a horse
 *     description: Retrieves all active custom log categories for a specific horse. Only the horse owner can access the categories.
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
 *     responses:
 *       200:
 *         description: List of custom log categories
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
 *                   ownerId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   color:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   sortOrder:
 *                     type: number
 *                   owner:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       logs:
 *                         type: number
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
 *     summary: Create a new custom log category
 *     description: Creates a new custom log category for a horse. Only the horse owner can create categories.
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
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Optional category description
 *               icon:
 *                 type: string
 *                 description: Icon identifier (default: ClipboardList)
 *               color:
 *                 type: string
 *                 description: Color theme (default: text-indigo-600)
 *               isActive:
 *                 type: boolean
 *                 description: Whether category is active (default: true)
 *               sortOrder:
 *                 type: number
 *                 description: Sort order for category (default: 0)
 *     responses:
 *       201:
 *         description: Custom category created successfully
 *       400:
 *         description: Bad request (invalid data or category name already exists)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Horse not found or access denied
 */

/**
 * GET /api/horses/[id]/categories
 * Get all custom log categories for a horse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Track user id for error capture without leaking scope
  let distinctId: string | undefined;
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    distinctId = user.id;

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const categories = await getCustomCategoriesByHorseId(horseId, user.id);
    
    if (categories === null) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching custom categories:", error);
    try { const { id } = await params; captureApiError({ error, context: 'horse_custom_categories_get', route: '/api/horses/[id]/categories', method: 'GET', horseId: id, distinctId }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch custom categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses/[id]/categories
 * Create a new custom log category for a horse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Track user id for error capture without leaking scope
  let distinctId: string | undefined;
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    distinctId = user.id;

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();

    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    if (data.name.trim().length > 50) {
      return NextResponse.json(
        { error: "Category name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    const category = await createCustomCategory(horseId, user.id, {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      icon: data.icon || undefined,
      color: data.color || undefined,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    });
    
    if (!category) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating custom category:", error);
    try { const { id } = await params; captureApiError({ error, context: 'horse_custom_category_create_post', route: '/api/horses/[id]/categories', method: 'POST', horseId: id, distinctId }); } catch {}
    
    if (error instanceof Error && error.message.includes('Category name already exists')) {
      return NextResponse.json(
        { error: "Category name already exists for this horse" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create custom category" },
      { status: 500 }
    );
  }
}
