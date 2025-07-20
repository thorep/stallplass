import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { 
  getAllRoadmapItems, 
  createRoadmapItem, 
  updateRoadmapItem, 
  deleteRoadmapItem 
} from '@/services/roadmap-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const roadmapItems = await getAllRoadmapItems();
    return NextResponse.json(roadmapItems);
  } catch (error) {
    console.error('Error fetching roadmap items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmap items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const roadmapItem = await createRoadmapItem(body);
    return NextResponse.json(roadmapItem);
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    return NextResponse.json(
      { error: 'Failed to create roadmap item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;
    const roadmapItem = await updateRoadmapItem(id, data);
    return NextResponse.json(roadmapItem);
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    return NextResponse.json(
      { error: 'Failed to update roadmap item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    await deleteRoadmapItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting roadmap item:', error);
    return NextResponse.json(
      { error: 'Failed to delete roadmap item' },
      { status: 500 }
    );
  }
}