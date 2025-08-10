import { NextResponse } from 'next/server';
import { getSections, createSection } from '@/services/forum/forum-service';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';

export async function GET() {
  try {
    const sections = await getSections();
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching forum sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum sections' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request) => {
  try {
    const data = await request.json();
    const section = await createSection(data);
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Error creating forum section:', error);
    return NextResponse.json(
      { error: 'Failed to create forum section' },
      { status: 500 }
    );
  }
});