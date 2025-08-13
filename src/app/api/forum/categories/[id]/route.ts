import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  updateCategory, 
  deleteCategory,
  getCategoryBySlug 
} from "@/services/forum/forum-service";
import type { UpdateCategoryInput } from "@/types/forum";

/**
 * GET /api/forum/categories/[id]
 * Get a category by ID or slug
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Try to get by slug (more user-friendly URLs)
    const category = await getCategoryBySlug(id);
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forum/categories/[id]
 * Update a forum category
 * Admin only
 */
export async function PUT(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await routeContext.params;
    const data: UpdateCategoryInput = await request.json();

    const category = await updateCategory(id, data);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    const err = error as { code?: string };
    
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "Category name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forum/categories/[id]
 * Delete (deactivate) a forum category
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await routeContext.params;
    await deleteCategory(id);
    
    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    const err = error as { code?: string };
    
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}