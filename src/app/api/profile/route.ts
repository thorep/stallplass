import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { getProfileById, updateProfile } from '@/services/profile-service';
import { z } from 'zod';
import { createApiLogger } from '@/lib/logger';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstname: z.string().min(1).max(100).optional().or(z.literal('')),
  middlename: z.string().min(1).max(100).optional().or(z.literal('')),
  lastname: z.string().min(1).max(100).optional().or(z.literal('')),
  nickname: z.string().min(1).max(100).optional().or(z.literal('')),
  phone: z.string().min(1).max(20).optional().or(z.literal('')),
  Adresse1: z.string().min(1).max(200).optional().or(z.literal('')),
  Adresse2: z.string().min(1).max(200).optional().or(z.literal('')),
  Postnummer: z.string().min(4).max(10).optional().or(z.literal('')),
  Poststed: z.string().min(1).max(100).optional().or(z.literal('')),
  message_notification_email: z.boolean().optional()
});

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     description: Retrieves the profile information for the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - type: object
 *                   properties:
 *                     Adresse1:
 *                       type: string
 *                       nullable: true
 *                       description: Primary address line
 *                     Adresse2:
 *                       type: string
 *                       nullable: true
 *                       description: Secondary address line
 *                     Postnummer:
 *                       type: string
 *                       nullable: true
 *                       description: Postal code
 *                     Poststed:
 *                       type: string
 *                       nullable: true
 *                       description: Postal area/city
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Profile creation date
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Profile last update date
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Profile not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch profile"
 */
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
      Adresse1: profile.Adresse1,
      Adresse2: profile.Adresse2,
      Postnummer: profile.Postnummer,
      Poststed: profile.Poststed,
      isAdmin: profile.isAdmin,
      message_notification_email: profile.message_notification_email,
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

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Updates the profile information for the currently authenticated user. All fields are optional.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: First name
 *               middlename:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Middle name
 *               lastname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Last name
 *               nickname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Display nickname
 *               phone:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20
 *                 description: Phone number
 *               Adresse1:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Primary address line
 *               Adresse2:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Secondary address line
 *               Postnummer:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 10
 *                 description: Postal code
 *               Poststed:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Postal area/city
 *           example:
 *             firstname: "Ole"
 *             lastname: "Hansen"
 *             nickname: "OleH"
 *             phone: "+47 12345678"
 *             Adresse1: "Storgata 1"
 *             Postnummer: "0001"
 *             Poststed: "Oslo"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - type: object
 *                   properties:
 *                     Adresse1:
 *                       type: string
 *                       nullable: true
 *                       description: Primary address line
 *                     Adresse2:
 *                       type: string
 *                       nullable: true
 *                       description: Secondary address line
 *                     Postnummer:
 *                       type: string
 *                       nullable: true
 *                       description: Postal code
 *                     Poststed:
 *                       type: string
 *                       nullable: true
 *                       description: Postal area/city
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Profile creation date
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Profile last update date
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid input data"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       expected:
 *                         type: string
 *                       received:
 *                         type: string
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to update profile"
 */
export const PUT = withAuth(async (request: NextRequest, { profileId }) => {
  const apiLogger = createApiLogger({ 
    endpoint: '/api/profile', 
    method: 'PUT', 
    profileId 
  });
  
  try {
    const body = await request.json();
    apiLogger.info('Profile update requested', { profileId, body });
    
    // Validate input data
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      apiLogger.warn('Profile update validation failed', { 
        profileId, 
        body, 
        errors: validationResult.error.issues 
      });
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
    apiLogger.info('Profile updated successfully', { profileId });

    // Return only the fields we want to expose
    const profileData = {
      id: updatedProfile.id,
      firstname: updatedProfile.firstname,
      middlename: updatedProfile.middlename,
      lastname: updatedProfile.lastname,
      nickname: updatedProfile.nickname,
      phone: updatedProfile.phone,
      Adresse1: updatedProfile.Adresse1,
      Adresse2: updatedProfile.Adresse2,
      Postnummer: updatedProfile.Postnummer,
      Poststed: updatedProfile.Poststed,
      isAdmin: updatedProfile.isAdmin,
      message_notification_email: updatedProfile.message_notification_email,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt
    };

    return NextResponse.json(profileData);
  } catch (error) {
    apiLogger.error('Error updating profile', { 
      profileId, 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});