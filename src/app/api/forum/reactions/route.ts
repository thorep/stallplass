import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  addReaction,
  getReactions
} from "@/services/forum/forum-service";
import { getPostHogServer } from "@/lib/posthog-server";

/**
 * GET /api/forum/reactions
 * Get reactions for a post
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const reactions = await getReactions(postId);
    return NextResponse.json(reactions);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'forum_reactions_get' }); } catch {}
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forum/reactions
 * Add a reaction to a post
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

    // Validate reaction type
    const validTypes = ['like', 'helpful', 'thanks', 'love', 'laugh', 'sad', 'angry'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    const reaction = await addReaction(user.id, postId, type);
    
    return NextResponse.json(reaction, { status: 201 });
  } catch (error: unknown) {
    console.error("Error adding reaction:", error);
    try { const ph = getPostHogServer(); ph.captureException(error, user.id, { context: 'forum_reaction_add' }); } catch {}
    
    if (error instanceof Error && error.message === "Post not found") {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

// Note: DELETE method with body is not well-supported in Next.js App Router
// Consider using a separate endpoint like /api/forum/reactions/remove with POST method
// For now, we'll keep DELETE but be aware of potential client compatibility issues
