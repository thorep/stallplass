import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  updateReply,
  deleteReply
} from "@/services/forum/forum-service";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * PUT /api/forum/replies/[id]
 * Update a reply
 * Requires authentication, user must own reply
 */
export async function PUT(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: replyId } = await routeContext.params;
    const { content } = await request.json();

    // Validate content
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length < 5) {
      return NextResponse.json(
        { error: "Reply must be at least 5 characters" },
        { status: 400 }
      );
    }

    const reply = await updateReply(user.id, replyId, content);
    return NextResponse.json(reply);
  } catch (error: unknown) {
    console.error("Error updating reply:", error);
    try {
      const { id } = await routeContext.params;
      captureApiError({ error, context: 'forum_reply_update_put', route: '/api/forum/replies/[id]', method: 'PUT', replyId: id, distinctId: user.id });
    } catch {}
    
    if ((error as Error).message === "Reply not found") {
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      );
    }

    if ((error as Error).message === "This is not a reply") {
      return NextResponse.json(
        { error: "This is not a reply" },
        { status: 400 }
      );
    }

    if ((error as Error).message === "Not authorized to update this reply") {
      return NextResponse.json(
        { error: "Not authorized to update this reply" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update reply" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forum/replies/[id]
 * Delete a reply
 * Requires authentication, user must own reply or be admin
 */
export async function DELETE(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const { id: replyId } = await routeContext.params;
    await deleteReply(user.id, replyId);
    
    return NextResponse.json(
      { message: "Reply deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting reply:", error);
    try {
      const { id } = await routeContext.params;
      captureApiError({ error, context: 'forum_reply_delete', route: '/api/forum/replies/[id]', method: 'DELETE', replyId: id, distinctId: user.id });
    } catch {}
    
    if ((error as Error).message === "Reply not found") {
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      );
    }

    if ((error as Error).message === "This is not a reply") {
      return NextResponse.json(
        { error: "This is not a reply" },
        { status: 400 }
      );
    }

    if ((error as Error).message === "Not authorized to delete this reply") {
      return NextResponse.json(
        { error: "Not authorized to delete this reply" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
