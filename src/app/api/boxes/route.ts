import { NextRequest, NextResponse } from 'next/server';
import { createBox } from '@/services/box-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating box with data:', data);
    
    // Validate required fields
    if (!data.name || !data.price || !data.stableId) {
      return NextResponse.json(
        { error: 'Name, price, and stableId are required' },
        { status: 400 }
      );
    }

    // Check if stable exists
    const { prisma } = await import('@/lib/prisma');
    
    const stable = await prisma.stable.findUnique({
      where: { id: data.stableId }
    });
    
    if (!stable) {
      console.error('Stable not found:', data.stableId);
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    const box = await createBox(data);
    
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    console.error('Error creating box:', error);
    return NextResponse.json(
      { error: 'Failed to create box' },
      { status: 500 }
    );
  }
}