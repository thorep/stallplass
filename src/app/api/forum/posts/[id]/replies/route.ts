import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  createReply
} from "@/services/forum/forum-service";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * POST /api/forum/posts/[id]/replies
 * Create a reply to a thread
 * Requires authentication
 */
export async function POST(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: threadId } = await routeContext.params;
    const data = await request.json();

    // Validate content
    if (!data.content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (data.content.length < 5) {
      return NextResponse.json(
        { error: "Reply must be at least 5 characters" },
        { status: 400 }
      );
    }

    const reply = await createReply(user.id, threadId, data);
    
    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error("Error creating reply:", error);
    try { const { id } = await routeContext.params; captureApiError({ error, context: 'forum_reply_create_post', route: '/api/forum/posts/[id]/replies', method: 'POST', threadId: id, distinctId: user.id }); } catch {}
    const err = error as Error;
    
    if (err.message === "Thread not found") {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if (err.message === "Cannot reply to a reply") {
      return NextResponse.json(
        { error: "Cannot reply to a reply" },
        { status: 400 }
      );
    }

    if (err.message === "Thread is locked") {
      return NextResponse.json(
        { error: "Thread is locked" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
