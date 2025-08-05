import { getHorseBySlug } from "@/services/horse-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/horses/public/{slug}:
 *   get:
 *     summary: Get a public horse by slug
 *     description: |
 *       Retrieves a public horse profile by its slug. This endpoint does not require 
 *       authentication and only returns horses that have been marked as public.
 *       This is used for public horse profile pages.
 *     tags:
 *       - Horses
 *       - Public
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         description: URL slug of the horse (e.g., "thunder-fjordhest")
 *         schema:
 *           type: string
 *           example: "thunder-fjordhest"
 *     responses:
 *       200:
 *         description: Public horse profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Horse ID
 *                 name:
 *                   type: string
 *                   description: Horse name
 *                 breed:
 *                   type: string
 *                   nullable: true
 *                   description: Horse breed
 *                 age:
 *                   type: integer
 *                   nullable: true
 *                   description: Horse age in years
 *                 gender:
 *                   type: string
 *                   nullable: true
 *                   enum: [STALLION, MARE, GELDING]
 *                   description: Horse gender
 *                 color:
 *                   type: string
 *                   nullable: true
 *                   description: Horse color/coat
 *                 description:
 *                   type: string
 *                   nullable: true
 *                   description: Additional description
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                   description: Main horse image URL
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *                   description: Profile image URL
 *                 isActive:
 *                   type: boolean
 *                   description: Whether horse is active (not archived)
 *                 isPublic:
 *                   type: boolean
 *                   description: Whether horse profile is publicly visible (always true for this endpoint)
 *                 slug:
 *                   type: string
 *                   description: URL slug for public horse profile
 *                 ownerId:
 *                   type: string
 *                   description: ID of the owner
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 owner:
 *                   type: object
 *                   nullable: true
 *                   description: Owner profile information (if included)
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                       nullable: true
 *             example:
 *               id: "horse123"
 *               name: "Thunder"
 *               breed: "Norsk Fjordhest"
 *               age: 8
 *               gender: "GELDING"
 *               color: "Brun dun"
 *               description: "Thunder er en rolig og pålitelig fjordhest. Han er perfekt for både nybegynnere og erfarne ryttere. Med sin snille natur og gode manerer er han en favoritt på stallen."
 *               imageUrl: "https://example.com/thunder-main.jpg"
 *               profileImage: "https://example.com/thunder-profile.jpg"
 *               isActive: true
 *               isPublic: true
 *               slug: "thunder-fjordhest"
 *               ownerId: "user456"
 *               createdAt: "2024-01-10T10:00:00Z"
 *               updatedAt: "2024-01-15T12:00:00Z"
 *               owner:
 *                 id: "user456"
 *                 nickname: "Kari Hestemor"
 *                 profileImage: "https://example.com/kari-profile.jpg"
 *       400:
 *         description: Bad request - missing or invalid slug
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Slug is required"
 *       404:
 *         description: Horse not found or not public
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse not found"
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/horses/public/[slug]
 * Get a public horse by slug (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;
    
    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    const horse = await getHorseBySlug(slug);
    
    if (!horse) {
      return NextResponse.json(
        { error: "Horse not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(horse);
  } catch (error) {
    console.error("Error fetching public horse:", error);
    return NextResponse.json(
      { error: "Failed to fetch horse" },
      { status: 500 }
    );
  }
}