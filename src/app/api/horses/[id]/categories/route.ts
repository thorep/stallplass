import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCustomCategory, getCustomCategoriesByHorseId } from '@/services/horse-log-service';
import { z } from 'zod';
import { captureApiError } from '@/lib/posthog-capture';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd').max(100, 'Navn for langt'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

/**
 * GET /api/horses/[id]/categories
 * Get all categories for a horse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { id: horseId } = await params;

    const categories = await getCustomCategoriesByHorseId(horseId, user.id);

    if (categories === null) {
      return NextResponse.json({ error: 'Uautorisert' }, { status: 403 });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    try { captureApiError({ error, context: 'categories_get', route: '/api/horses/[id]/categories', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Kunne ikke hente kategorier' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses/[id]/categories
 * Create a new category for a horse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { id: horseId } = await params;
    const body = await request.json();

    const validationResult = createCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ugyldig data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const category = await createCustomCategory(horseId, user.id, validationResult.data);

    if (category === null) {
      return NextResponse.json({ error: 'Uautorisert' }, { status: 403 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof Error && error.message === 'Category name already exists for this horse') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    try { captureApiError({ error, context: 'categories_post', route: '/api/horses/[id]/categories', method: 'POST' }); } catch {}
    return NextResponse.json(
      { error: 'Kunne ikke opprette kategori' },
      { status: 500 }
    );
  }
}