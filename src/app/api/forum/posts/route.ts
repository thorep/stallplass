import { requireAuth } from "@/lib/auth";
import { createThread, getThreads } from "@/services/forum/forum-service";
import type { CreateThreadInput, GetThreadsOptions } from "@/types/forum";
import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json({ error: "Kunne ikke hente tråder" }, { status: 500 });
  }
}

/**
 * POST /api/forum/posts
 * Create a new forum thread
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const data: CreateThreadInput = await request.json();

    // Validate required fields
    if (!data.title || !data.content || !data.categoryId) {
      return NextResponse.json(
        { error: "Tittel, innhold og kategori er påkrevd" },
        { status: 400 }
      );
    }

    // Validate title length for mobile friendliness
    if (data.title.length < 3) {
      return NextResponse.json({ error: "Tittelen må være minst 3 tegn" }, { status: 400 });
    }

    if (data.title.length > 100) {
      return NextResponse.json({ error: "Tittelen må være under 100 tegn" }, { status: 400 });
    }

    // Validate content length
    if (data.content.length < 10) {
      return NextResponse.json({ error: "Innholdet må være minst 10 tegn" }, { status: 400 });
    }

    const thread = await createThread(user.id, data);

    return NextResponse.json(thread, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating thread:", error);

    if (error instanceof Error && error.message === "Category not found") {
      return NextResponse.json({ error: "Ugyldig kategori" }, { status: 400 });
    }

    return NextResponse.json({ error: "Kunne ikke opprette tråd" }, { status: 500 });
  }
}
