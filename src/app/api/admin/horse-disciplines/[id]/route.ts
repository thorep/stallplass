import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getPostHogServer } from '@/lib/posthog-server';

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

    const discipline = await prisma.horse_disciplines.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({ data: discipline });
  } catch (error: unknown) {
    console.error('Error updating horse discipline:', error);
    try { const ph = getPostHogServer(); const { id } = await params; ph.captureException(error, undefined, { context: 'admin_horse_discipline_put', id }); } catch {}
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Discipline name already exists' }, { status: 409 });
    }
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Discipline not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update horse discipline' }, { status: 500 });
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

    // Check if discipline is used in any horse sales
    const horseSalesCount = await prisma.horse_sales.count({
      where: { disciplineId: id },
    });

    if (horseSalesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete discipline that is used in horse sales' },
        { status: 400 }
      );
    }

    await prisma.horse_disciplines.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting horse discipline:', error);
    try { const ph = getPostHogServer(); const { id } = await params; ph.captureException(error, undefined, { context: 'admin_horse_discipline_delete', id }); } catch {}
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Discipline not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete horse discipline' }, { status: 500 });
  }
}
