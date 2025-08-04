import { authenticateRequest } from "@/lib/supabase-auth-middleware";
import { createHorse, getUserHorses } from "@/services/horse-service";
import { CreateHorseData } from "@/types/horse";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/horses
 * Get all horses for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const horses = await getUserHorses(authResult.uid, includeArchived);
    
    return NextResponse.json(horses);
  } catch (error) {
    console.error("Error fetching user horses:", error);
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
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data: CreateHorseData = await request.json();

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Horse name is required" },
        { status: 400 }
      );
    }

    const horse = await createHorse(authResult.uid, data);
    
    return NextResponse.json(horse, { status: 201 });
  } catch (error) {
    console.error("Error creating horse:", error);
    return NextResponse.json(
      { error: "Failed to create horse" },
      { status: 500 }
    );
  }
}