import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  getCategories, 
  createCategory 
} from "@/services/forum/forum-service";
import type { CreateCategoryInput } from "@/types/forum";
import { getPostHogServer } from "@/lib/posthog-server";

/**
 * @swagger
 * /api/forum/categories:
 *   get:
 *     summary: Get all forum categories
 *     description: Returns all active forum categories with post counts
 *     tags:
 *       - Forum
 *     security: []
 *     responses:
 *       200:
 *         description: List of forum categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   color:
 *                     type: string
 *                     nullable: true
 *                   icon:
 *                     type: string
 *                     nullable: true
 *                   sortOrder:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *                   postCount:
 *                     type: integer
 *       500:
 *         description: Server error
 */

/**
 * GET /api/forum/categories
 * Get all active forum categories
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    console.log('[FORUM API] Fetching categories...');
    const categories = await getCategories();
    console.log('[FORUM API] Categories found:', categories.length, categories.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[FORUM API] Error fetching categories:", error);
    try {
      const ph = getPostHogServer();
      ph.captureException(error, undefined, { context: 'forum_categories_get' });
    } catch {}
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/forum/categories:
 *   post:
 *     summary: Create a new forum category
 *     description: Creates a new forum category (Admin only)
 *     tags:
 *       - Forum
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly category slug
 *               description:
 *                 type: string
 *                 nullable: true
 *               color:
 *                 type: string
 *                 description: Hex color code
 *                 nullable: true
 *               icon:
 *                 type: string
 *                 description: Icon name
 *                 nullable: true
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Category name or slug already exists
 */

/**
 * POST /api/forum/categories
 * Create a new forum category
 * Admin only
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const data: CreateCategoryInput = await request.json();

    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Create slug from name if not provided (ensure URL-friendly)
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const category = await createCategory({
      ...data,
      slug,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    try {
      const ph = getPostHogServer();
      ph.captureException(error, undefined, { context: 'forum_category_create' });
    } catch {}
    const err = error as { code?: string };
    
    // Handle unique constraint violations
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "Category name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
