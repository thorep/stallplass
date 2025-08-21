import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { updateHorseSaleSchema } from '@/lib/horse-sales-validation';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const horseSale = await prisma.horse_sales.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        breed: true,
        discipline: true,
        profiles: {
          select: {
            id: true,
            nickname: true,
          },
        },
        counties: true,
        municipalities: true,
      },
    });

    if (!horseSale) {
      return NextResponse.json({ error: 'Horse sale not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.horse_sales.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ data: horseSale });
  } catch (error) {
    console.error('Error fetching horse sale:', error);
    const posthog = getPostHogServer();
    const { id } = await params;
    posthog.captureException(error, undefined, { context: 'horse_sale_get', id });
    return NextResponse.json({ error: 'Failed to fetch horse sale' }, { status: 500 });
  }
}

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

    // Check if user owns this horse sale
    const existingHorseSale = await prisma.horse_sales.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingHorseSale) {
      return NextResponse.json({ error: 'Horse sale not found' }, { status: 404 });
    }

    if (existingHorseSale.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input using Zod schema
    const validationResult = updateHorseSaleSchema.safeParse({
      ...body,
      price: body.price ? parseInt(body.price) : undefined,
      age: body.age ? parseInt(body.age) : undefined,
      height: body.height !== undefined ? (body.height ? parseInt(body.height) : null) : undefined,
      latitude: body.latitude !== undefined ? (body.latitude ? parseFloat(body.latitude) : null) : undefined,
      longitude: body.longitude !== undefined ? (body.longitude ? parseFloat(body.longitude) : null) : undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Filter out undefined values from validated data
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const horseSale = await prisma.horse_sales.update({
      where: { id },
      data: updateData,
      include: {
        breed: true,
        discipline: true,
        counties: true,
        municipalities: true,
      },
    });

    return NextResponse.json({ data: horseSale });
  } catch (error) {
    console.error('Error updating horse sale:', error);
    const posthog = getPostHogServer();
    const { id } = await params;
    posthog.captureException(error, undefined, { context: 'horse_sale_update', id });
    return NextResponse.json({ error: 'Failed to update horse sale' }, { status: 500 });
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

    // Check if user owns this horse sale
    const existingHorseSale = await prisma.horse_sales.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingHorseSale) {
      return NextResponse.json({ error: 'Horse sale not found' }, { status: 404 });
    }

    if (existingHorseSale.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.horse_sales.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting horse sale:', error);
    const posthog = getPostHogServer();
    const { id } = await params;
    posthog.captureException(error, undefined, { context: 'horse_sale_delete', id });
    return NextResponse.json({ error: 'Failed to delete horse sale' }, { status: 500 });
  }
}
