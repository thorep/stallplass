import { NextRequest, NextResponse } from 'next/server';
import { updateBox, deleteBox, getBoxById } from '@/services/box-service';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';
import { logger, createApiLogger } from '@/lib/logger';

// GET route is public - used for viewing box details on /bokser/[id] pages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const box = await getBoxById(params.id);
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(box);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch box' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    const data = await request.json();
    
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only update boxes in your own stables' },
        { status: 403 }
      );
    }
    
    const updatedBox = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(updatedBox);
  } catch (error) {
    logger.error('Box update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update box' },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    const data = await request.json();
    
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only update boxes in your own stables' },
        { status: 403 }
      );
    }
    
    // For PATCH, we only update the fields provided
    const updatedBox = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(updatedBox);
  } catch (error) {
    logger.error('Box patch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update box' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  { profileId },
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    // Check if box exists and user owns the stable
    const box = await prisma.boxes.findUnique({
      where: { id: params.id },
      include: { stables: { select: { ownerId: true } } }
    });
    
    if (!box) {
      return NextResponse.json(
        { error: 'Box not found' },
        { status: 404 }
      );
    }
    
    if (box.stables.ownerId !== profileId) {
      return NextResponse.json(
        { error: 'You can only delete boxes in your own stables' },
        { status: 403 }
      );
    }
    
    await deleteBox(params.id);
    
    return NextResponse.json({ message: 'Box deleted successfully' });
  } catch (error) {
    logger.error('Box delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete box' },
      { status: 500 }
    );
  }
});