import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/services/prisma';
import { createHorseBuySchema } from '@/lib/horse-buy-validation';

export async function GET() {
  try {
    const horseBuys = await prisma.horse_buys.findMany({
      where: { archived: false, deletedAt: null },
      include: {
        breed: true,
        discipline: true,
        profiles: { select: { id: true, nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: horseBuys });
  } catch (error) {
    console.error('Error fetching horse buys:', error);
    return NextResponse.json({ error: 'Failed to fetch horse buys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const validationResult = createHorseBuySchema.safeParse({
      ...body,
      priceMin: body.priceMin !== undefined && body.priceMin !== '' ? parseInt(body.priceMin) : undefined,
      priceMax: body.priceMax !== undefined && body.priceMax !== '' ? parseInt(body.priceMax) : undefined,
      ageMin: body.ageMin !== undefined && body.ageMin !== '' ? parseInt(body.ageMin) : undefined,
      ageMax: body.ageMax !== undefined && body.ageMax !== '' ? parseInt(body.ageMax) : undefined,
      heightMin: body.heightMin !== undefined && body.heightMin !== '' ? parseInt(body.heightMin) : undefined,
      heightMax: body.heightMax !== undefined && body.heightMax !== '' ? parseInt(body.heightMax) : undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({ field: err.path.join('.'), message: err.message }));
      const firstError = errors[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed', details: errors }, { status: 400 });
    }

    const data = validationResult.data;

    const created = await prisma.horse_buys.create({
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
        images: data.images || [],
        imageDescriptions: data.imageDescriptions || [],
        userId: user.id,
      },
      include: {
        breed: true,
        discipline: true,
        profiles: { select: { id: true, nickname: true } },
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating horse buy:', error);
    return NextResponse.json({ error: 'Failed to create horse buy' }, { status: 500 });
  }
}

