import { NextRequest, NextResponse } from 'next/server';
import { getProfileById, updateProfile, deleteProfile } from '@/services/profile-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const profile = await getProfileById(params.id);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    
    const profile = await updateProfile(params.id, data);
    
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update profile' },
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
    await deleteProfile(params.id);
    
    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}