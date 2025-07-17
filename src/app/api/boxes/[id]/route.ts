import { NextRequest, NextResponse } from 'next/server';
import { updateBox, deleteBox, getBoxById } from '@/services/box-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    console.error('Error fetching box:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const box = await updateBox({
      id: params.id,
      ...data
    });
    
    return NextResponse.json(box);
  } catch (error) {
    console.error('Error updating box:', error);
    return NextResponse.json(
      { error: 'Failed to update box' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteBox(params.id);
    
    return NextResponse.json({ message: 'Box deleted successfully' });
  } catch (error) {
    console.error('Error deleting box:', error);
    return NextResponse.json(
      { error: 'Failed to delete box' },
      { status: 500 }
    );
  }
}