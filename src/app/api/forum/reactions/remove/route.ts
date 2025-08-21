import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { removeReaction } from "@/services/forum/forum-service";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * POST /api/forum/reactions/remove
 * Remove a reaction from a post
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { postId, type } = await request.json();

    // Validate input
    if (!postId || !type) {
      return NextResponse.json(
        { error: "postId and type are required" },
        { status: 400 }
      );
    }

    await removeReaction(user.id, postId, type);
    
    return NextResponse.json(
      { message: "Reaction removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing reaction:", error);
    try { captureApiError({ error, context: 'forum_reaction_remove_post', route: '/api/forum/reactions/remove', method: 'POST', distinctId: user.id }); } catch {}
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}
