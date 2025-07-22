import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { createArticle, getStableArticles } from '@/services/article-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

    const articles = await getStableArticles(stableId, includeUnpublished);

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { title, content, excerpt, cover_image, tags, is_published, featured } = body;

    // Verify user owns this stable
    const { data: stable, error: stableError } = await supabaseServer
      .from('stables')
      .select('owner_id')
      .eq('id', stableId)
      .single();

    if (stableError || !stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.owner_id !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create article
    const article = await createArticle({
      stable_id: stableId,
      title,
      content,
      excerpt: excerpt || null,
      cover_image: cover_image || null,
      tags: tags || [],
      is_published: is_published || false,
      featured: featured || false
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}