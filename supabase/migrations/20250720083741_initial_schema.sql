-- Create custom types/enums
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'ARCHIVED', 'RENTAL_CONFIRMED');
CREATE TYPE message_type AS ENUM ('TEXT', 'RENTAL_REQUEST', 'RENTAL_CONFIRMATION', 'SYSTEM');
CREATE TYPE rental_status AS ENUM ('ACTIVE', 'ENDED', 'CANCELLED');
CREATE TYPE box_type AS ENUM ('BOKS', 'UTEGANG');
CREATE TYPE roadmap_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE roadmap_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('VIPPS', 'CARD', 'BYPASS');
CREATE TYPE reviewee_type AS ENUM ('RENTER', 'STABLE_OWNER');
CREATE TYPE entity_type AS ENUM ('STABLE', 'BOX');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    firebase_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone TEXT,
    bio TEXT,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create stable_amenities table
CREATE TABLE stable_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT UNIQUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create box_amenities table
CREATE TABLE box_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT UNIQUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stables table
CREATE TABLE stables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    county TEXT,
    rating FLOAT DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    advertising_active BOOLEAN DEFAULT FALSE,
    advertising_end_date TIMESTAMP WITH TIME ZONE,
    advertising_start_date TIMESTAMP WITH TIME ZONE,
    image_descriptions TEXT[] DEFAULT '{}',
    total_boxes INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users(firebase_id) ON DELETE CASCADE
);

-- Create boxes table
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    size FLOAT,
    is_available BOOLEAN DEFAULT TRUE,
    is_indoor BOOLEAN DEFAULT TRUE,
    has_window BOOLEAN DEFAULT FALSE,
    has_electricity BOOLEAN DEFAULT FALSE,
    has_water BOOLEAN DEFAULT FALSE,
    max_horse_size TEXT,
    special_notes TEXT,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stable_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    image_descriptions TEXT[] DEFAULT '{}',
    is_sponsored BOOLEAN DEFAULT FALSE,
    sponsored_start_date TIMESTAMP WITH TIME ZONE,
    sponsored_until TIMESTAMP WITH TIME ZONE,
    box_type box_type DEFAULT 'BOKS',
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE
);

-- Create stable_amenity_links table
CREATE TABLE stable_amenity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stable_id UUID NOT NULL,
    amenity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (amenity_id) REFERENCES stable_amenities(id) ON DELETE CASCADE,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    UNIQUE(stable_id, amenity_id)
);

-- Create box_amenity_links table
CREATE TABLE box_amenity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    box_id UUID NOT NULL,
    amenity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (amenity_id) REFERENCES box_amenities(id) ON DELETE CASCADE,
    FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE,
    UNIQUE(box_id, amenity_id)
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id TEXT NOT NULL,
    stable_id UUID NOT NULL,
    box_id UUID,
    status conversation_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (box_id) REFERENCES boxes(id),
    FOREIGN KEY (rider_id) REFERENCES users(firebase_id) ON DELETE CASCADE,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    UNIQUE(rider_id, stable_id, box_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'TEXT',
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(firebase_id) ON DELETE CASCADE
);

-- Create rentals table
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID UNIQUE NOT NULL,
    rider_id TEXT NOT NULL,
    stable_id UUID NOT NULL,
    box_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    monthly_price INTEGER NOT NULL,
    status rental_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (rider_id) REFERENCES users(firebase_id) ON DELETE CASCADE,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE
);

-- Create base_prices table
CREATE TABLE base_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_discounts table
CREATE TABLE pricing_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    months INTEGER UNIQUE NOT NULL,
    percentage FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roadmap_items table
CREATE TABLE roadmap_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status roadmap_status DEFAULT 'PLANNED',
    priority roadmap_priority DEFAULT 'MEDIUM',
    estimated_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    months INTEGER NOT NULL,
    discount FLOAT DEFAULT 0,
    total_amount INTEGER NOT NULL,
    vipps_order_id TEXT UNIQUE NOT NULL,
    vipps_reference TEXT,
    status payment_status DEFAULT 'PENDING',
    payment_method payment_method DEFAULT 'VIPPS',
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stable_id UUID NOT NULL,
    firebase_id TEXT NOT NULL,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(firebase_id) ON DELETE CASCADE
);

-- Create stable_faqs table
CREATE TABLE stable_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stable_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewee_id TEXT NOT NULL,
    reviewee_type reviewee_type NOT NULL,
    stable_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT,
    communication_rating INTEGER,
    cleanliness_rating INTEGER,
    facilities_rating INTEGER,
    reliability_rating INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(firebase_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(firebase_id) ON DELETE CASCADE,
    FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    UNIQUE(rental_id, reviewer_id, reviewee_type)
);

-- Create page_views table
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type entity_type NOT NULL,
    entity_id TEXT NOT NULL,
    viewer_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (viewer_id) REFERENCES users(firebase_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX page_views_entity_type_entity_id_idx ON page_views (entity_type, entity_id);
CREATE INDEX page_views_created_at_idx ON page_views (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stables ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stable_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Enable real-time for chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stables BEFORE UPDATE ON stables FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stable_amenities BEFORE UPDATE ON stable_amenities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_box_amenities BEFORE UPDATE ON box_amenities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_boxes BEFORE UPDATE ON boxes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_conversations BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rentals BEFORE UPDATE ON rentals FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_base_prices BEFORE UPDATE ON base_prices FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pricing_discounts BEFORE UPDATE ON pricing_discounts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_roadmap_items BEFORE UPDATE ON roadmap_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_stable_faqs BEFORE UPDATE ON stable_faqs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();