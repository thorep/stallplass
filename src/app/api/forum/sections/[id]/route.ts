import { NextResponse, NextRequest } from 'next/server';
import { updateSection, deleteSection } from '@/services/forum/forum-service';
import { requireAdmin } from '@/lib/auth';
import { captureApiError } from '@/lib/posthog-capture';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
      const { id } = await context.params;
      if (!id) {
        return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
      }

      const data = await request.json();
      const section = await updateSection(id, data);
      return NextResponse.json(section);
    } catch (error) {
      console.error('Error updating forum section:', error);
      try { const { id } = await context.params; captureApiError({ error, context: 'forum_section_update_put', route: '/api/forum/sections/[id]', method: 'PUT', sectionId: id }); } catch {}
      return NextResponse.json(
        { error: 'Failed to update forum section' },
        { status: 500 }
      );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
      const { id } = await context.params;
      if (!id) {
        return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
      }

      await deleteSection(id);
      return NextResponse.json({ message: 'Section deleted successfully' });
    } catch (error) {
      console.error('Error deleting forum section:', error);
      try { const { id } = await context.params; captureApiError({ error, context: 'forum_section_delete', route: '/api/forum/sections/[id]', method: 'DELETE', sectionId: id }); } catch {}
      return NextResponse.json(
        { error: 'Failed to delete forum section' },
        { status: 500 }
      );
  }
}
