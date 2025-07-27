import { NextRequest, NextResponse } from 'next/server';
import { createSuggestion, getAllSuggestions } from '@/services/suggestion-service';
import { getAuthUser } from '@/lib/auth-helpers';

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
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Only authenticated users (admins) can view suggestions
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may want to implement proper admin role checking)
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const suggestions = await getAllSuggestions();
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}