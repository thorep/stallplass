-- Add missing columns and tables to complete the English schema

-- Create base_prices table if it doesn't exist
CREATE TABLE IF NOT EXISTS base_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_discounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS pricing_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    months INTEGER NOT NULL UNIQUE,
    percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update page_views table columns (Norwegian -> English)
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS viewer_id UUID;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update roadmap_items table columns (Norwegian -> English)
ALTER TABLE roadmap_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE roadmap_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add foreign key for page_views (if users table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'page_views_viewer_id_fkey') THEN
            ALTER TABLE page_views ADD CONSTRAINT page_views_viewer_id_fkey 
              FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;