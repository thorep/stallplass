-- Create service type enum
CREATE TYPE service_type AS ENUM ('veterinarian', 'farrier', 'trainer');

-- Create payment status enum
CREATE TYPE service_payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    service_type service_type NOT NULL,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create service_areas table for geographic coverage
CREATE TABLE service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    county TEXT NOT NULL, -- fylke
    municipality TEXT, -- kommune/city (optional for county-wide coverage)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_photos table
CREATE TABLE service_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_payments table
CREATE TABLE service_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    payment_status service_payment_status DEFAULT 'pending',
    vipps_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_discounts table for pricing tiers
CREATE TABLE service_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duration_months INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 50.00, -- 50 NOK base price
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_service_type ON services(service_type);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_expires_at ON services(expires_at);
CREATE INDEX idx_service_areas_service_id ON service_areas(service_id);
CREATE INDEX idx_service_areas_county ON service_areas(county);
CREATE INDEX idx_service_areas_municipality ON service_areas(municipality);
CREATE INDEX idx_service_photos_service_id ON service_photos(service_id);
CREATE INDEX idx_service_payments_service_id ON service_payments(service_id);
CREATE INDEX idx_service_payments_user_id ON service_payments(user_id);

-- Add RLS policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_discounts ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Users can insert their own services" ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON services FOR DELETE USING (auth.uid() = user_id);

-- Service areas policies
CREATE POLICY "Service areas are viewable by everyone" ON service_areas FOR SELECT USING (true);
CREATE POLICY "Users can manage areas for their services" ON service_areas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update areas for their services" ON service_areas FOR UPDATE USING (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete areas for their services" ON service_areas FOR DELETE USING (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);

-- Service photos policies
CREATE POLICY "Service photos are viewable by everyone" ON service_photos FOR SELECT USING (true);
CREATE POLICY "Users can manage photos for their services" ON service_photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update photos for their services" ON service_photos FOR UPDATE USING (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete photos for their services" ON service_photos FOR DELETE USING (
    EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);

-- Service payments policies
CREATE POLICY "Users can view their own payments" ON service_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON service_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON service_payments FOR UPDATE USING (auth.uid() = user_id);

-- Service discounts are viewable by everyone
CREATE POLICY "Service discounts are viewable by everyone" ON service_discounts FOR SELECT USING (true);

-- Insert default discount tiers
INSERT INTO service_discounts (duration_months, base_price, discount_percentage, final_price) VALUES
(1, 50.00, 0, 50.00),      -- 1 month: 50 NOK
(3, 50.00, 10, 135.00),    -- 3 months: 10% discount (45 NOK/month)
(6, 50.00, 15, 255.00),    -- 6 months: 15% discount (42.50 NOK/month)
(12, 50.00, 20, 480.00);   -- 12 months: 20% discount (40 NOK/month)

-- Update function for services
CREATE OR REPLACE FUNCTION update_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function for payments
CREATE OR REPLACE FUNCTION update_service_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER services_updated_at_trigger
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_service_updated_at();

CREATE TRIGGER service_payments_updated_at_trigger
    BEFORE UPDATE ON service_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_service_payment_updated_at();