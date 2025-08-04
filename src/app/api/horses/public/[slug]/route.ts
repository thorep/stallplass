import { getHorseBySlug } from "@/services/horse-service";
import { NextRequest, NextResponse } from "next/server";

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