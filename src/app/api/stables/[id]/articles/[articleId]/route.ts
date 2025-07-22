import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { getArticle, updateArticle, deleteArticle, incrementArticleViews } from '@/services/article-service';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: stableId, articleId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const incrementViews = searchParams.get('incrementViews') === 'true';

    const article = await getArticle(stableId, articleId);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment view count if requested (for public article views)
    if (incrementViews && article.is_published) {
      await incrementArticleViews(articleId);
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: stableId, articleId } = resolvedParams;
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

    // Update article
    const article = await updateArticle(articleId, stableId, {
      title,
      content,
      excerpt,
      cover_image,
      tags,
      is_published,
      featured
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: stableId, articleId } = resolvedParams;

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

    await deleteArticle(articleId, stableId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}