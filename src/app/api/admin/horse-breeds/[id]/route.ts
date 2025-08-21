import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, isActive } = await request.json();

    const breed = await prisma.horse_breeds.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({ data: breed });
  } catch (error: unknown) {
    console.error('Error updating horse breed:', error);
    try { const { id } = await params; captureApiError({ error, context: 'admin_horse_breed_put', route: '/api/admin/horse-breeds/[id]', method: 'PUT', id }); } catch {}
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Breed name already exists' }, { status: 409 });
    }
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Breed not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update horse breed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if breed is used in any horse sales
    const horseSalesCount = await prisma.horse_sales.count({
      where: { breedId: id },
    });

    if (horseSalesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete breed that is used in horse sales' },
        { status: 400 }
      );
    }

    await prisma.horse_breeds.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting horse breed:', error);
    try { const { id } = await params; captureApiError({ error, context: 'admin_horse_breed_delete', route: '/api/admin/horse-breeds/[id]', method: 'DELETE', id }); } catch {}
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Breed not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete horse breed' }, { status: 500 });
  }
}
