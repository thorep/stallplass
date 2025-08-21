import { requireAuth } from "@/lib/auth";
import { createHorse, getUserHorses } from "@/services/horse-service";
import { CreateHorseData } from "@/types/horse";
import { NextRequest, NextResponse } from "next/server";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * @swagger
 * /api/horses:
 *   get:
 *     summary: Get all horses for authenticated user
 *     description: |
 *       Retrieves all horses owned by the authenticated user and horses that have been shared with them. 
 *       By default, only active (non-archived) horses are returned.
 *       Use includeArchived parameter to also get archived horses.
 *     tags:
 *       - Horses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: includeArchived
 *         in: query
 *         required: false
 *         description: Include archived horses in the response
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: List of user's horses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Horse ID
 *                   name:
 *                     type: string
 *                     description: Horse name
 *                   breed:
 *                     type: string
 *                     nullable: true
 *                     description: Horse breed
 *                   age:
 *                     type: integer
 *                     nullable: true
 *                     description: Horse age in years
 *                   gender:
 *                     type: string
 *                     nullable: true  
 *                     enum: [STALLION, MARE, GELDING]
 *                     description: Horse gender
 *                   color:
 *                     type: string
 *                     nullable: true
 *                     description: Horse color/coat
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     description: Additional description
 *                   imageUrl:
 *                     type: string
 *                     nullable: true
 *                     description: Main horse image URL
 *                   profileImage:
 *                     type: string
 *                     nullable: true
 *                     description: Profile image URL
 *                   isActive:
 *                     type: boolean
 *                     description: Whether horse is active (not archived)
 *                   isPublic:
 *                     type: boolean
 *                     description: Whether horse profile is publicly visible
 *                   slug:
 *                     type: string
 *                     nullable: true
 *                     description: URL slug for public horse profile
 *                   ownerId:
 *                     type: string
 *                     description: ID of the owner
 *                   isOwner:
 *                     type: boolean
 *                     description: Whether the current user owns this horse
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     nullable: true
 *                     description: Permissions for shared horses (VIEW, EDIT, ADD_LOGS)
 *                   sharedBy:
 *                     type: object
 *                     nullable: true
 *                     description: Information about who shared this horse (only for shared horses)
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *             example:
 *               - id: "horse123"
 *                 name: "Thunder"
 *                 breed: "Norsk Fjordhest"
 *                 age: 8
 *                 gender: "GELDING"
 *                 color: "Brun dun"
 *                 description: "Rolig og pålitelig ridhest"
 *                 imageUrl: "https://example.com/horse1.jpg"
 *                 profileImage: "https://example.com/profile1.jpg"
 *                 isActive: true
 *                 isPublic: true
 *                 slug: "thunder-fjordhest"
 *                 ownerId: "user456"
 *                 isOwner: true
 *                 permissions: null
 *                 sharedBy: null
 *                 createdAt: "2024-01-10T10:00:00Z"
 *               - id: "horse124"
 *                 name: "Bella"
 *                 breed: "Tinker"
 *                 age: 12
 *                 gender: "MARE"
 *                 color: "Skjeckete"
 *                 isActive: false
 *                 isPublic: false
 *                 ownerId: "owner123"
 *                 isOwner: false
 *                 permissions: ["VIEW", "EDIT"]
 *                 sharedBy:
 *                   id: "owner123"
 *                   nickname: "Maria"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new horse
 *     description: |
 *       Creates a new horse profile for the authenticated user.
 *       Only the horse owner can create horse profiles.
 *     tags:
 *       - Horses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Horse name
 *                 minLength: 1
 *               breed:
 *                 type: string
 *                 nullable: true
 *                 description: Horse breed
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 nullable: true
 *                 description: Horse age in years
 *               gender:
 *                 type: string
 *                 enum: [STALLION, MARE, GELDING]
 *                 nullable: true
 *                 description: Horse gender
 *               color:
 *                 type: string
 *                 nullable: true
 *                 description: Horse color/coat
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Additional description
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Main horse image URL
 *               profileImage:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: Profile image URL
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 description: Whether horse profile should be publicly visible
 *           example:
 *             name: "Storm"
 *             breed: "Islandshest"
 *             age: 6
 *             gender: "STALLION"
 *             color: "Skimmel"
 *             description: "Ung og energisk hest med god karakter"
 *             imageUrl: "https://example.com/storm.jpg"
 *             isPublic: true
 *     responses:
 *       201:
 *         description: Horse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 breed:
 *                   type: string
 *                   nullable: true
 *                 age:
 *                   type: integer
 *                   nullable: true
 *                 gender:
 *                   type: string
 *                   nullable: true
 *                 color:
 *                   type: string
 *                   nullable: true
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *                 isActive:
 *                   type: boolean
 *                 isPublic:
 *                   type: boolean
 *                 slug:
 *                   type: string
 *                   nullable: true
 *                 ownerId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "horse125"
 *               name: "Storm"
 *               breed: "Islandshest"
 *               age: 6
 *               gender: "STALLION"
 *               color: "Skimmel"
 *               description: "Ung og energisk hest med god karakter"
 *               imageUrl: "https://example.com/storm.jpg"
 *               isActive: true
 *               isPublic: true
 *               slug: "storm-islandshest"
 *               ownerId: "user456"
 *               createdAt: "2024-01-15T15:00:00Z"
 *       400:
 *         description: Bad request - missing or invalid horse name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Horse name is required"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/horses
 * Get all horses for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const horses = await getUserHorses(user.id, includeArchived);
    
    return NextResponse.json(horses);
  } catch (error) {
    console.error("Error fetching user horses:", error);
    try { captureApiError({ error, context: 'horses_get', route: '/api/horses', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch horses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/horses
 * Create a new horse (only owner can create)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const data: CreateHorseData = await request.json();

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Horse name is required" },
        { status: 400 }
      );
    }

    const horse = await createHorse(user.id, data);
    
    return NextResponse.json(horse, { status: 201 });
  } catch (error) {
    console.error("Error creating horse:", error);
    try { captureApiError({ error, context: 'horse_create_post', route: '/api/horses', method: 'POST' }); } catch {}
    return NextResponse.json(
      { error: "Failed to create horse" },
      { status: 500 }
    );
  }
}
