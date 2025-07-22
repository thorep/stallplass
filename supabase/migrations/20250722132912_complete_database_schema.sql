-- Complete database schema for Stallplass platform
-- Horse stable management and discovery platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom enum types
CREATE TYPE box_type AS ENUM ('BOKS', 'UTEGANG');
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'ARCHIVED', 'RENTAL_CONFIRMED');
CREATE TYPE entity_type AS ENUM ('STABLE', 'BOX');
CREATE TYPE message_type AS ENUM ('TEXT', 'RENTAL_REQUEST', 'RENTAL_CONFIRMATION', 'SYSTEM');
CREATE TYPE payment_method AS ENUM ('VIPPS', 'CARD', 'BYPASS');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE rental_status AS ENUM ('ACTIVE', 'ENDED', 'CANCELLED');
CREATE TYPE reviewee_type AS ENUM ('RENTER', 'STABLE_OWNER');
CREATE TYPE roadmap_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE roadmap_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Users table (core authentication and profiles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    avatar TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Base prices for advertising
CREATE TABLE base_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing discounts for multi-month advertising
CREATE TABLE pricing_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    months INTEGER NOT NULL,
    percentage NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Box quantity discounts
CREATE TABLE box_quantity_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    min_boxes INTEGER NOT NULL,
    max_boxes INTEGER,
    discount_percentage NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stable amenities (facilities offered by stables)
CREATE TABLE stable_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Box amenities (features of individual boxes/stalls)
CREATE TABLE box_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main stables table
CREATE TABLE stables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    city TEXT,
    county TEXT,
    postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    owner_id TEXT NOT NULL REFERENCES users(firebase_id),
    owner_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    images TEXT[],
    image_descriptions TEXT[],
    total_boxes INTEGER,
    rating NUMERIC,
    review_count INTEGER,
    featured BOOLEAN DEFAULT false,
    advertising_active BOOLEAN DEFAULT false,
    advertising_start_date TIMESTAMPTZ,
    advertising_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual boxes/stalls within stables
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    size NUMERIC,
    box_type box_type,
    is_indoor BOOLEAN,
    has_electricity BOOLEAN,
    has_water BOOLEAN,
    has_window BOOLEAN,
    max_horse_size TEXT,
    special_notes TEXT,
    images TEXT[],
    image_descriptions TEXT[],
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_sponsored BOOLEAN DEFAULT false,
    sponsored_start_date TIMESTAMPTZ,
    sponsored_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link stables to their amenities (many-to-many)
CREATE TABLE stable_amenity_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES stable_amenities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stable_id, amenity_id)
);

-- Link boxes to their amenities (many-to-many)
CREATE TABLE box_amenity_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES box_amenities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(box_id, amenity_id)
);

-- Conversations between riders and stable owners
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    rider_id TEXT NOT NULL REFERENCES users(firebase_id),
    box_id UUID REFERENCES boxes(id),
    status conversation_status DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(firebase_id),
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'TEXT',
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental agreements
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id),
    stable_id UUID NOT NULL REFERENCES stables(id),
    box_id UUID NOT NULL REFERENCES boxes(id),
    rider_id TEXT NOT NULL REFERENCES users(firebase_id),
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_price NUMERIC NOT NULL,
    status rental_status DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment records for advertising
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(firebase_id),
    firebase_id TEXT NOT NULL,
    stable_id UUID NOT NULL REFERENCES stables(id),
    vipps_order_id TEXT NOT NULL,
    vipps_reference TEXT,
    amount NUMERIC NOT NULL,
    discount NUMERIC,
    total_amount NUMERIC NOT NULL,
    months INTEGER NOT NULL,
    payment_method payment_method,
    status payment_status DEFAULT 'PENDING',
    metadata JSONB,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews system (two-way: renters can review stable owners and vice versa)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id),
    stable_id UUID NOT NULL REFERENCES stables(id),
    reviewer_id TEXT NOT NULL REFERENCES users(firebase_id),
    reviewee_id TEXT NOT NULL REFERENCES users(firebase_id),
    reviewee_type reviewee_type NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    -- Detailed ratings
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
    facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
    -- Moderation
    is_public BOOLEAN DEFAULT true,
    is_moderated BOOLEAN DEFAULT false,
    moderator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page view tracking for analytics
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    viewer_id TEXT REFERENCES users(firebase_id),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stable articles/blog posts
CREATE TABLE stable_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stable_id, slug)
);

-- FAQ sections for stables
CREATE TABLE stable_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_id UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform roadmap items
CREATE TABLE roadmap_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status roadmap_status DEFAULT 'PLANNED',
    priority roadmap_priority DEFAULT 'MEDIUM',
    estimated_date DATE,
    completed_date DATE,
    sort_order INTEGER,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE stable_articles 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_stables_owner_id ON stables(owner_id);
CREATE INDEX idx_stables_location ON stables USING gin(to_tsvector('english', location));
CREATE INDEX idx_stables_advertising ON stables(advertising_active, advertising_end_date) WHERE advertising_active = true;
CREATE INDEX idx_stables_featured ON stables(featured) WHERE featured = true;
CREATE INDEX idx_stables_coordinates ON stables(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_boxes_stable_id ON boxes(stable_id);
CREATE INDEX idx_boxes_available ON boxes(is_available, is_active) WHERE is_available = true AND is_active = true;
CREATE INDEX idx_boxes_sponsored ON boxes(is_sponsored, sponsored_until) WHERE is_sponsored = true;

CREATE INDEX idx_conversations_stable_id ON conversations(stable_id);
CREATE INDEX idx_conversations_rider_id ON conversations(rider_id);
CREATE INDEX idx_conversations_status ON conversations(status);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_rentals_stable_id ON rentals(stable_id);
CREATE INDEX idx_rentals_rider_id ON rentals(rider_id);
CREATE INDEX idx_rentals_status ON rentals(status);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stable_id ON payments(stable_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_vipps_order_id ON payments(vipps_order_id);

CREATE INDEX idx_reviews_stable_id ON reviews(stable_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_public ON reviews(is_public) WHERE is_public = true;

CREATE INDEX idx_page_views_entity ON page_views(entity_type, entity_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);

CREATE INDEX idx_stable_articles_stable_id ON stable_articles(stable_id);
CREATE INDEX idx_stable_articles_published ON stable_articles(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_stable_articles_slug ON stable_articles(stable_id, slug);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stables ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stable_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stable_faqs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these should be customized based on your authentication setup)
-- Users can read all public user data, update their own
CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = firebase_id);

-- Stables are publicly readable
CREATE POLICY "Stables are publicly readable" ON stables FOR SELECT USING (true);
CREATE POLICY "Users can update own stables" ON stables FOR UPDATE USING (auth.uid()::text = owner_id);
CREATE POLICY "Users can create stables" ON stables FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- Boxes inherit stable permissions
CREATE POLICY "Boxes are publicly readable" ON boxes FOR SELECT USING (true);
CREATE POLICY "Stable owners can manage boxes" ON boxes FOR ALL USING (
    EXISTS (SELECT 1 FROM stables WHERE stables.id = boxes.stable_id AND stables.owner_id = auth.uid()::text)
);

-- Conversations are private to participants
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
    auth.uid()::text = rider_id OR 
    EXISTS (SELECT 1 FROM stables WHERE stables.id = conversations.stable_id AND stables.owner_id = auth.uid()::text)
);

-- Messages inherit conversation permissions
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (
            conversations.rider_id = auth.uid()::text OR 
            EXISTS (SELECT 1 FROM stables WHERE stables.id = conversations.stable_id AND stables.owner_id = auth.uid()::text)
        )
    )
);

-- Public articles are readable by everyone
CREATE POLICY "Published articles are publicly readable" ON stable_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Stable owners can manage own articles" ON stable_articles FOR ALL USING (
    EXISTS (SELECT 1 FROM stables WHERE stables.id = stable_articles.stable_id AND stables.owner_id = auth.uid()::text)
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stables BEFORE UPDATE ON stables FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_boxes BEFORE UPDATE ON boxes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rentals BEFORE UPDATE ON rentals FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stable_articles BEFORE UPDATE ON stable_articles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stable_faqs BEFORE UPDATE ON stable_faqs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_base_prices BEFORE UPDATE ON base_prices FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pricing_discounts BEFORE UPDATE ON pricing_discounts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_box_quantity_discounts BEFORE UPDATE ON box_quantity_discounts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stable_amenities BEFORE UPDATE ON stable_amenities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_box_amenities BEFORE UPDATE ON box_amenities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_roadmap_items BEFORE UPDATE ON roadmap_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();