import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase-auth-middleware";
import { 
  getThreadById, 
  updateThread, 
  deleteThread,
  incrementViewCount
} from "@/services/forum/forum-service";
import type { UpdateThreadInput } from "@/types/forum";

/**
 * GET /api/forum/posts/[id]
 * Get a single thread with all replies
 * Public endpoint, increments view count
 */
export async function GET(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await routeContext.params;
    
    // Get the thread
    const thread = await getThreadById(id);
    
    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Increment view count asynchronously (don't wait)
    incrementViewCount(id).catch(console.error);

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forum/posts/[id]
 * Update a forum thread
 * Requires authentication, user must own thread or be admin
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { profileId },
  routeContext: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await routeContext.params;
    const data: UpdateThreadInput = await request.json();

    // Validate if updating title
    if (data.title !== undefined) {
      if (data.title.length < 5) {
        return NextResponse.json(
          { error: "Title must be at least 5 characters" },
          { status: 400 }
        );
      }
      if (data.title.length > 100) {
        return NextResponse.json(
          { error: "Title must be less than 100 characters" },
          { status: 400 }
        );
      }
    }

    // Validate if updating content
    if (data.content !== undefined && data.content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const thread = await updateThread(profileId, id, data);
    return NextResponse.json(thread);
  } catch (error: unknown) {
    console.error("Error updating thread:", error);
    
    if ((error as Error).message === "Thread not found") {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if ((error as Error).message === "Not authorized to update this thread") {
      return NextResponse.json(
        { error: "Not authorized to update this thread" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/forum/posts/[id]
 * Delete a forum thread
 * Requires authentication, user must own thread or be admin
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { profileId },
  routeContext: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await routeContext.params;
    await deleteThread(profileId, id);
    
    return NextResponse.json(
      { message: "Thread deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting thread:", error);
    
    if ((error as Error).message === "Thread not found") {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if ((error as Error).message === "Not authorized to delete this thread") {
      return NextResponse.json(
        { error: "Not authorized to delete this thread" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
});