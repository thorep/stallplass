import { NextRequest, NextResponse } from 'next/server';
import { searchForumPosts } from '@/services/forum/forum-service';
import type { ForumSearchFilters } from '@/types/forum';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('q') || searchParams.get('query') || undefined;
    const categoriesParam = searchParams.get('categories');
    const author = searchParams.get('author') || undefined;
    const hasImagesParam = searchParams.get('hasImages');
    const sortBy = (searchParams.get('sortBy') as ForumSearchFilters['sortBy']) || 'relevance';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    // Parse categories array (comma-separated string or JSON array)
    let categories: string[] = [];
    if (categoriesParam) {
      try {
        // Try parsing as JSON array first
        categories = JSON.parse(categoriesParam);
        if (!Array.isArray(categories)) {
          // If not an array, treat as comma-separated string
          categories = categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
      } catch {
        // Fallback to comma-separated string
        categories = categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);
      }
    }
    
    // Parse boolean and numeric parameters
    const hasImages = hasImagesParam === 'true' || hasImagesParam === '1';
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 20;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;
    
    // Validate sortBy parameter
    const validSortOptions = ['relevance', 'newest', 'oldest', 'most_replies'];
    const validatedSortBy = validSortOptions.includes(sortBy) 
      ? sortBy as ForumSearchFilters['sortBy']
      : 'relevance';
    
    // Build search filters
    const filters: ForumSearchFilters = {
      query,
      categories,
      author,
      hasImages,
      sortBy: validatedSortBy,
      limit,
      offset,
    };
    
    // Execute search
    const searchResponse = await searchForumPosts(filters);
    
    return NextResponse.json({
      data: searchResponse
    });
    
  } catch (error) {
    console.error('Forum search error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}