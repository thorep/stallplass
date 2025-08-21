import { requireAuth } from "@/lib/auth";
import { createThread, getThreads } from "@/services/forum/forum-service";
import type { CreateThreadInput, GetThreadsOptions } from "@/types/forum";
import { NextRequest, NextResponse } from "next/server";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * GET /api/forum/posts
 * Get forum threads with pagination and filters
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const options: GetThreadsOptions = {
      categoryId: searchParams.get("categoryId") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
      orderBy: (searchParams.get("orderBy") as "latest" | "pinned" | "popular") || "latest",
      searchQuery: searchParams.get("search") || undefined,
    };

    const result = await getThreads(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching threads:", error);
    try { captureApiError({ error, context: 'forum_threads_get', route: '/api/forum/posts', method: 'GET' }); } catch {}
    return NextResponse.json({ error: "Kunne ikke hente tråder" }, { status: 500 });
  }
}

/**
 * POST /api/forum/posts
 * Create a new forum thread
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  console.log('[FORUM] POST /api/forum/posts - Starting thread creation request');
  
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    console.log('[FORUM] Authentication failed - returning 401');
    return authResult;
  }
  const user = authResult;
  console.log('[FORUM] User authenticated:', { userId: user.id, email: user.email });
  
  try {
    const data: CreateThreadInput = await request.json();
    console.log('[FORUM] Request data received:', {
      hasTitle: !!data.title,
      titleLength: data.title?.length || 0,
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      categoryId: data.categoryId
    });

    // Validate required fields
    if (!data.title || !data.content || !data.categoryId) {
      console.log('[FORUM] Validation failed - missing required fields:', {
        hasTitle: !!data.title,
        hasContent: !!data.content,
        hasCategoryId: !!data.categoryId
      });
      return NextResponse.json(
        { error: "Tittel, innhold og kategori er påkrevd" },
        { status: 400 }
      );
    }

    // Validate title length for mobile friendliness
    if (data.title.length < 3) {
      console.log('[FORUM] Validation failed - title too short:', data.title.length);
      return NextResponse.json({ error: "Tittelen må være minst 3 tegn" }, { status: 400 });
    }

    if (data.title.length > 100) {
      console.log('[FORUM] Validation failed - title too long:', data.title.length);
      return NextResponse.json({ error: "Tittelen må være under 100 tegn" }, { status: 400 });
    }

    // Validate content length
    if (data.content.length < 10) {
      console.log('[FORUM] Validation failed - content too short:', data.content.length);
      return NextResponse.json({ error: "Innholdet må være minst 10 tegn" }, { status: 400 });
    }

    console.log('[FORUM] All validations passed - calling createThread service');
    const thread = await createThread(user.id, data);
    console.log('[FORUM] Thread created successfully:', { threadId: thread.id, title: thread.title });

    return NextResponse.json(thread, { status: 201 });
  } catch (error: unknown) {
    console.error('[FORUM] Error creating thread:', error);
    try { captureApiError({ error, context: 'forum_thread_create_post', route: '/api/forum/posts', method: 'POST', distinctId: user.id }); } catch {}
    
    if (error instanceof Error) {
      console.error('[FORUM] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message === "Category not found") {
        console.log('[FORUM] Category validation failed');
        return NextResponse.json({ error: "Ugyldig kategori" }, { status: 400 });
      }
    }

    console.error('[FORUM] Unexpected error - returning 500');
    return NextResponse.json({ error: "Kunne ikke opprette tråd" }, { status: 500 });
  }
}
