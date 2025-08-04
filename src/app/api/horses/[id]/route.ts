import { authenticateRequest } from "@/lib/supabase-auth-middleware";
import { getHorseById, updateHorse, deleteHorse } from "@/services/horse-service";
import { UpdateHorseData } from "@/types/horse";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/horses/[id]
 * Get a horse by ID (only owner can access, or if public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const horse = await getHorseById(horseId, authResult.uid);
    
    if (!horse) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(horse);
  } catch (error) {
    console.error("Error fetching horse:", error);
    return NextResponse.json(
      { error: "Failed to fetch horse" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/horses/[id]
 * Update a horse (only owner can update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const data: UpdateHorseData = await request.json();

    // Validate name if provided
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Horse name cannot be empty" },
        { status: 400 }
      );
    }

    const horse = await updateHorse(horseId, authResult.uid, data);
    
    if (!horse) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(horse);
  } catch (error) {
    console.error("Error updating horse:", error);
    return NextResponse.json(
      { error: "Failed to update horse" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/horses/[id]
 * Delete/archive a horse (only owner can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const horseId = (await params).id;
    
    if (!horseId) {
      return NextResponse.json(
        { error: "Horse ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteHorse(horseId, authResult.uid);
    
    if (!success) {
      return NextResponse.json(
        { error: "Horse not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Horse deleted successfully" });
  } catch (error) {
    console.error("Error deleting horse:", error);
    return NextResponse.json(
      { error: "Failed to delete horse" },
      { status: 500 }
    );
  }
}