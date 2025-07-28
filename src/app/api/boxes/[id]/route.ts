import { NextRequest, NextResponse } from 'next/server';
import { updateBox, deleteBox, getBoxById } from '@/services/box-service';

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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch box' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const data = await request.json();
    
    const box = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(box);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update box' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const data = await request.json();
    
    // For PATCH, we only update the fields provided
    const box = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(box);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update box' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    await deleteBox(params.id);
    
    return NextResponse.json({ message: 'Box deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete box' },
      { status: 500 }
    );
  }
}