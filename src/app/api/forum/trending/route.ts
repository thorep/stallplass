import { NextRequest, NextResponse } from "next/server";
import { getTrendingThreads } from "@/services/forum/forum-service";
import type { TrendingThreadOptions } from "@/types/forum";
import { getPostHogServer } from "@/lib/posthog-server";
import { captureApiError } from "@/lib/posthog-capture";

/**
 * GET /api/forum/trending
 * Get trending forum topics based on recent activity (replies, views, reactions)
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const options: TrendingThreadOptions = {
      limit: parseInt(searchParams.get("limit") || "10"),
      days: parseInt(searchParams.get("days") || "7"),
    };

    // Validate parameters
    if (options.limit && (options.limit < 1 || options.limit > 50)) {
      return NextResponse.json(
        { error: "Grense må være mellom 1 og 50" },
        { status: 400 }
      );
    }

    if (options.days && (options.days < 1 || options.days > 30)) {
      return NextResponse.json(
        { error: "Dager må være mellom 1 og 30" },
        { status: 400 }
      );
    }

    const trendingThreads = await getTrendingThreads(options);
    
    return NextResponse.json({ 
      data: trendingThreads,
      meta: {
        limit: options.limit,
        days: options.days,
        count: trendingThreads.length,
      }
    });
  } catch (error) {
    console.error("Error fetching trending threads:", error);
    try { captureApiError({ error, context: 'forum_trending_get', route: '/api/forum/trending', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: "Kunne ikke hente populære tråder" },
      { status: 500 }
    );
  }
}
