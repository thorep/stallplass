-- Create stable_articles table for blog posts by stable owners
CREATE TABLE stable_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stable_id UUID NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL-friendly version of title
    content TEXT NOT NULL,
    excerpt TEXT, -- Short summary for previews
    cover_image TEXT, -- Optional cover image URL
    is_published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE, -- For highlighting important articles
    view_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}', -- Array of tags for categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    UNIQUE(stable_id, slug) -- Ensure unique slugs per stable
);

-- Create indexes for performance
CREATE INDEX stable_articles_stable_id_published_idx ON stable_articles (stable_id, is_published, published_at DESC);
CREATE INDEX stable_articles_featured_idx ON stable_articles (featured, is_published, published_at DESC);
CREATE INDEX stable_articles_tags_idx ON stable_articles USING GIN (tags);
CREATE INDEX stable_articles_slug_idx ON stable_articles (stable_id, slug);

-- Enable Row Level Security
ALTER TABLE stable_articles ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER set_timestamp_stable_articles 
    BEFORE UPDATE ON stable_articles 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

-- Create RLS policies
-- Allow stable owners to manage their articles
CREATE POLICY "Stable owners can manage their articles" ON stable_articles
    FOR ALL USING (
        stable_id IN (
            SELECT id FROM stables 
            WHERE owner_id = auth.jwt() ->> 'user_id'
        )
    );

-- Allow public read access to published articles
CREATE POLICY "Public can view published articles" ON stable_articles
    FOR SELECT USING (is_published = true);

-- Enable real-time for article updates (optional for admin notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE stable_articles;