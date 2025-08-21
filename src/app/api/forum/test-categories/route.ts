import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getPostHogServer } from "@/lib/posthog-server";

export async function GET() {
  try {
    // Check if test category exists
    const testCategory = await prisma.forum_categories.findFirst({
      where: { slug: 'test' }
    });

    if (!testCategory) {
      // Create test category
      const newCategory = await prisma.forum_categories.create({
        data: {
          name: 'Test',
          slug: 'test',
          description: 'Test kategori for utvikling',
          color: '#4CAF50',
          icon: '🧪',
          sortOrder: 999,
          isActive: true
        }
      });
      
      return NextResponse.json({ 
        message: 'Test category created', 
        category: newCategory 
      });
    }

    // Also fetch all categories
    const allCategories = await prisma.forum_categories.findMany({
      where: { isActive: true }
    });

    return NextResponse.json({ 
      message: 'Test category exists',
      testCategory,
      allCategories 
    });
  } catch (error) {
    console.error('Error handling test categories:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'forum_test_categories_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to handle test categories', details: error },
      { status: 500 }
    );
  }
}
