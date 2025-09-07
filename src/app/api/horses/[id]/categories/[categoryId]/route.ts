import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateCustomCategory, deleteCustomCategory } from '@/services/horse-log-service';
import { z } from 'zod';
import { captureApiError } from '@/lib/posthog-capture';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd').max(100, 'Navn for langt').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

/**
 * PUT /api/horses/[id]/categories/[categoryId]
 * Update a category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { id: horseId, categoryId } = await params;
    const body = await request.json();

    const validationResult = updateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ugyldig data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const category = await updateCustomCategory(categoryId, user.id, validationResult.data);

    if (category === null) {
      return NextResponse.json({ error: 'Uautorisert eller kategori ikke funnet' }, { status: 403 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof Error && error.message === 'Category name already exists for this horse') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    try { captureApiError({ error, context: 'categories_put', route: '/api/horses/[id]/categories/[categoryId]', method: 'PUT' }); } catch {}
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere kategori' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]/categories/[categoryId]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { categoryId } = await params;

    const success = await deleteCustomCategory(categoryId, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Uautorisert eller kategori ikke funnet' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Kategori slettet' });
  } catch (error) {
    console.error('Error deleting category:', error);
    try { captureApiError({ error, context: 'categories_delete', route: '/api/horses/[id]/categories/[categoryId]', method: 'DELETE' }); } catch {}
    return NextResponse.json(
      { error: 'Kunne ikke slette kategori' },
      { status: 500 }
    );
  }
}