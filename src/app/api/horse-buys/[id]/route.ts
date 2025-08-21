import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/services/prisma';
import { updateHorseBuySchema } from '@/lib/horse-buy-validation';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const horseBuy = await prisma.horse_buys.findUnique({
      where: { id },
      include: {
        breed: true,
        discipline: true,
        profiles: { select: { id: true, nickname: true } },
      },
    });

    if (!horseBuy) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: horseBuy });
  } catch (error) {
    console.error('Error fetching horse buy:', error);
    const posthog = getPostHogServer();
    posthog.captureException(error, undefined, {
      context: 'horse_buy_get',
      id
    });
    return NextResponse.json({ error: 'Failed to fetch horse buy' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.horse_buys.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateHorseBuySchema.safeParse({
      ...body,
      priceMin: body.priceMin !== undefined && body.priceMin !== '' ? parseInt(body.priceMin) : undefined,
      priceMax: body.priceMax !== undefined && body.priceMax !== '' ? parseInt(body.priceMax) : undefined,
      ageMin: body.ageMin !== undefined && body.ageMin !== '' ? parseInt(body.ageMin) : undefined,
      ageMax: body.ageMax !== undefined && body.ageMax !== '' ? parseInt(body.ageMax) : undefined,
      heightMin: body.heightMin !== undefined && body.heightMin !== '' ? parseInt(body.heightMin) : undefined,
      heightMax: body.heightMax !== undefined && body.heightMax !== '' ? parseInt(body.heightMax) : undefined,
    });
    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({ field: err.path.join('.'), message: err.message }));
      const firstError = errors[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed', details: errors }, { status: 400 });
    }

    const data = validation.data;
    const updated = await prisma.horse_buys.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        ageMin: data.ageMin ?? null,
        ageMax: data.ageMax ?? null,
        gender: data.gender ?? null,
        heightMin: data.heightMin ?? null,
        heightMax: data.heightMax ?? null,
        breedId: data.breedId ?? null,
        disciplineId: data.disciplineId ?? null,
        contactName: data.contactName,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        images: data.images ?? existing.images,
        imageDescriptions: data.imageDescriptions ?? existing.imageDescriptions,
        archived: data.archived ?? existing.archived,
      },
      include: {
        breed: true,
        discipline: true,
        profiles: { select: { id: true, nickname: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating horse buy:', error);
    const posthog = getPostHogServer();
    posthog.captureException(error, user?.id, {
      context: 'horse_buy_update',
      id
    });
    return NextResponse.json({ error: 'Failed to update horse buy' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.horse_buys.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await prisma.horse_buys.update({ where: { id }, data: { archived: true, deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting horse buy:', error);
    const posthog = getPostHogServer();
    posthog.captureException(error, user?.id, {
      context: 'horse_buy_delete',
      id
    });
    return NextResponse.json({ error: 'Failed to delete horse buy' }, { status: 500 });
  }
}
