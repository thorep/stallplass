import { NextRequest, NextResponse } from 'next/server';
import { ensureProfileExists } from '@/services/profile-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const profileData = {
      id: body.profileId || body.userId, // Support both for backward compatibility
      nickname: body.nickname || body.name || 'Bruker', // Default nickname if not provided
      phone: body.phone,
      updatedAt: new Date() // Required field
    };

    // Validate required fields
    if (!profileData.id || !profileData.nickname) {
      return NextResponse.json(
        { error: 'Profile ID and nickname are required' },
        { status: 400 }
      );
    }

    const profile = await ensureProfileExists(profileData);
    return NextResponse.json(profile, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create/update profile' },
      { status: 500 }
    );
  }
}