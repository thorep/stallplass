import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export type StableArticle = Tables<'stable_articles'>;
export type CreateArticleData = TablesInsert<'stable_articles'>;
export type UpdateArticleData = TablesUpdate<'stable_articles'>;

export interface StableArticleWithStats extends StableArticle {
  stable?: {
    name: string;
    owner_name: string;
  };
}

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get all published articles for a stable
 */
export async function getStableArticles(stableId: string, includeUnpublished = false): Promise<StableArticle[]> {
  let query = supabase
    .from('stable_articles')
    .select('*')
    .eq('stable_id', stableId)
    .order('published_at', { ascending: false });

  if (!includeUnpublished) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching articles: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single article by ID and stable ID
 */
export async function getArticle(stableId: string, articleId: string): Promise<StableArticle | null> {
  const { data, error } = await supabase
    .from('stable_articles')
    .select('*')
    .eq('id', articleId)
    .eq('stable_id', stableId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Article not found
    }
    throw new Error(`Error fetching article: ${error.message}`);
  }

  return data;
}

/**
 * Get a single article by slug and stable ID
 */
export async function getArticleBySlug(stableId: string, slug: string): Promise<StableArticle | null> {
  const { data, error } = await supabase
    .from('stable_articles')
    .select('*')
    .eq('stable_id', stableId)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Article not found
    }
    throw new Error(`Error fetching article: ${error.message}`);
  }

  return data;
}

/**
 * Get featured articles across all stables
 */
export async function getFeaturedArticles(limit = 6): Promise<StableArticleWithStats[]> {
  const { data, error } = await supabase
    .from('stable_articles')
    .select(`
      *,
      stable:stables!stable_articles_stable_id_fkey(
        name,
        owner_name
      )
    `)
    .eq('is_published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching featured articles: ${error.message}`);
  }

  return data as StableArticleWithStats[];
}

/**
 * Create a new article (server-side only)
 */
export async function createArticle(articleData: Omit<CreateArticleData, 'id' | 'created_at' | 'updated_at'>): Promise<StableArticle> {
  // Generate slug from title
  const slug = generateSlug(articleData.title);
  
  const { data, error } = await supabaseServer
    .from('stable_articles')
    .insert({
      ...articleData,
      slug,
      published_at: articleData.is_published ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating article: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing article (server-side only)
 */
export async function updateArticle(
  articleId: string, 
  stableId: string, 
  updates: UpdateArticleData
): Promise<StableArticle> {
  // If title is being updated, regenerate slug
  const updateData = { ...updates };
  if (updates.title) {
    updateData.slug = generateSlug(updates.title);
  }

  // Set published_at when publishing for the first time
  if (updates.is_published && !updates.published_at) {
    const { data: existingArticle } = await supabaseServer
      .from('stable_articles')
      .select('published_at')
      .eq('id', articleId)
      .single();

    if (existingArticle && !existingArticle.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabaseServer
    .from('stable_articles')
    .update(updateData)
    .eq('id', articleId)
    .eq('stable_id', stableId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating article: ${error.message}`);
  }

  return data;
}

/**
 * Delete an article (server-side only)
 */
export async function deleteArticle(articleId: string, stableId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('stable_articles')
    .delete()
    .eq('id', articleId)
    .eq('stable_id', stableId);

  if (error) {
    throw new Error(`Error deleting article: ${error.message}`);
  }
}

/**
 * Increment view count for an article
 */
export async function incrementArticleViews(articleId: string): Promise<void> {
  const { error } = await supabase
    .rpc('increment_article_views', { article_id: articleId });

  if (error) {
    console.warn(`Failed to increment article views: ${error.message}`);
    // Don't throw error as this is not critical
  }
}

/**
 * Check if slug is unique for a stable
 */
export async function isSlugUnique(stableId: string, slug: string, excludeArticleId?: string): Promise<boolean> {
  let query = supabase
    .from('stable_articles')
    .select('id')
    .eq('stable_id', stableId)
    .eq('slug', slug);

  if (excludeArticleId) {
    query = query.neq('id', excludeArticleId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error checking slug uniqueness: ${error.message}`);
  }

  return !data || data.length === 0;
}