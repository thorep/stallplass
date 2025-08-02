import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { getProfileById, updateProfile } from '@/services/profile-service';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstname: z.string().min(1).max(100).optional(),
  middlename: z.string().min(1).max(100).optional().or(z.literal('')),
  lastname: z.string().min(1).max(100).optional(),
  nickname: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional().or(z.literal(''))
});

export const GET = withAuth(async (_request: NextRequest, { profileId }) => {
  try {
    const profile = await getProfileById(profileId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Return only the fields we want to expose
    const profileData = {
      id: profile.id,
      firstname: profile.firstname,
      middlename: profile.middlename,
      lastname: profile.lastname,
      nickname: profile.nickname,
      phone: profile.phone,
      isAdmin: profile.isAdmin,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    return NextResponse.json(profileData);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, { profileId }) => {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update the profile
    const updatedProfile = await updateProfile(profileId, updateData);

    // Return only the fields we want to expose
    const profileData = {
      id: updatedProfile.id,
      firstname: updatedProfile.firstname,
      middlename: updatedProfile.middlename,
      lastname: updatedProfile.lastname,
      nickname: updatedProfile.nickname,
      phone: updatedProfile.phone,
      isAdmin: updatedProfile.isAdmin,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});