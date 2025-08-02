import { NextRequest, NextResponse } from 'next/server';
import { createSuggestion, getAllSuggestions } from '@/services/suggestion-service';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, email, name } = body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be less than 2000 characters' },
        { status: 400 }
      );
    }

    const suggestion = await createSuggestion({
      title: title?.trim() || undefined,
      description: description.trim(),
      email: email?.trim() || undefined,
      name: name?.trim() || undefined,
    });

    return NextResponse.json({ 
      success: true,
      suggestion: {
        id: suggestion.id,
        createdAt: suggestion.createdAt,
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(async () => {
  try {
    const suggestions = await getAllSuggestions();
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
});