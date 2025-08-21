import { NextResponse, NextRequest } from 'next/server';
import { getSections, createSection } from '@/services/forum/forum-service';
import { requireAdmin } from '@/lib/auth';
import { captureApiError } from '@/lib/posthog-capture';
// Removed unused PostHog import

export async function GET() {
  try {
    const sections = await getSections();
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching forum sections:', error);
    try { captureApiError({ error, context: 'forum_sections_get', route: '/api/forum/sections', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch forum sections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const data = await request.json();
    const section = await createSection(data);
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Error creating forum section:', error);
    try { captureApiError({ error, context: 'forum_section_create_post', route: '/api/forum/sections', method: 'POST' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to create forum section' },
      { status: 500 }
    );
  }
}
