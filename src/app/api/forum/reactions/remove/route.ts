import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase-auth-middleware";
import { removeReaction } from "@/services/forum/forum-service";

/**
 * POST /api/forum/reactions/remove
 * Remove a reaction from a post
 * Requires authentication
 */
export const POST = withAuth(async (
  request: NextRequest,
  { profileId }
) => {
  try {
    const { postId, type } = await request.json();

    // Validate input
    if (!postId || !type) {
      return NextResponse.json(
        { error: "postId and type are required" },
        { status: 400 }
      );
    }

    await removeReaction(profileId, postId, type);
    
    return NextResponse.json(
      { message: "Reaction removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
});