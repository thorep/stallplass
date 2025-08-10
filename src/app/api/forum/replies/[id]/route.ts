import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase-auth-middleware";
import { 
  updateReply,
  deleteReply
} from "@/services/forum/forum-service";

/**
 * PUT /api/forum/replies/[id]
 * Update a reply
 * Requires authentication, user must own reply
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { profileId },
  routeContext: { params: Promise<{ id: string }> }
) => {
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

    const reply = await updateReply(profileId, replyId, content);
    return NextResponse.json(reply);
  } catch (error: unknown) {
    console.error("Error updating reply:", error);
    
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
});

/**
 * DELETE /api/forum/replies/[id]
 * Delete a reply
 * Requires authentication, user must own reply or be admin
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { profileId },
  routeContext: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: replyId } = await routeContext.params;
    await deleteReply(profileId, replyId);
    
    return NextResponse.json(
      { message: "Reply deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting reply:", error);
    
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
});