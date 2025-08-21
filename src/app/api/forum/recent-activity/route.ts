import { NextRequest, NextResponse } from "next/server";
import { getRecentActivity } from "@/services/forum/forum-service";
import type { RecentActivityOptions } from "@/types/forum";
// Removed unused PostHog import
import { captureApiError } from "@/lib/posthog-capture";

/**
 * GET /api/forum/recent-activity
 * Get recent forum activity (new posts, replies) across all categories
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const options: RecentActivityOptions = {
      limit: parseInt(searchParams.get("limit") || "20"),
      categoryId: searchParams.get("categoryId") || undefined,
    };

    // Validate parameters
    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      return NextResponse.json(
        { error: "Grense må være mellom 1 og 100" },
        { status: 400 }
      );
    }

    const recentActivity = await getRecentActivity(options);
    
    return NextResponse.json({ 
      data: recentActivity,
      meta: {
        limit: options.limit,
        categoryId: options.categoryId,
        count: recentActivity.length,
      }
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    try { captureApiError({ error, context: 'forum_recent_activity_get', route: '/api/forum/recent-activity', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: "Kunne ikke hente nylig aktivitet" },
      { status: 500 }
    );
  }
}
