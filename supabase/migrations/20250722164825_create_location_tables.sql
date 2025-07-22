-- Create location tables for Norwegian administrative divisions

-- Create fylker (counties) table
CREATE TABLE fylker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fylke_nummer TEXT NOT NULL UNIQUE, -- e.g. "03", "11", "15"
    navn TEXT NOT NULL, -- e.g. "Oslo", "Rogaland", "More og Romsdal"
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create kommuner (municipalities) table
CREATE TABLE kommuner (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kommune_nummer TEXT NOT NULL UNIQUE, -- e.g. "0301", "1103", "1502"
    navn TEXT NOT NULL, -- e.g. "Oslo", "Stavanger", "Molde"
    fylke_id UUID REFERENCES fylker(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tettsteder (urban settlements) table
CREATE TABLE tettsteder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tettsted_nummer TEXT, -- SSB tettsted number if available
    navn TEXT NOT NULL, -- e.g. "Oslo", "Stavanger", "Molde sentrum"
    kommune_id UUID REFERENCES kommuner(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_fylker_fylke_nummer ON fylker(fylke_nummer);
CREATE INDEX idx_kommuner_kommune_nummer ON kommuner(kommune_nummer);
CREATE INDEX idx_kommuner_fylke_id ON kommuner(fylke_id);
CREATE INDEX idx_tettsteder_kommune_id ON tettsteder(kommune_id);
CREATE INDEX idx_tettsteder_tettsted_nummer ON tettsteder(tettsted_nummer) WHERE tettsted_nummer IS NOT NULL;

-- Enable RLS
ALTER TABLE fylker ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommuner ENABLE ROW LEVEL SECURITY;
ALTER TABLE tettsteder ENABLE ROW LEVEL SECURITY;

-- RLS policies - location data is public
CREATE POLICY "Fylker are viewable by everyone" ON fylker FOR SELECT USING (true);
CREATE POLICY "Kommuner are viewable by everyone" ON kommuner FOR SELECT USING (true);
CREATE POLICY "Tettsteder are viewable by everyone" ON tettsteder FOR SELECT USING (true);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER fylker_updated_at_trigger
    BEFORE UPDATE ON fylker
    FOR EACH ROW
    EXECUTE FUNCTION update_location_updated_at();

CREATE TRIGGER kommuner_updated_at_trigger
    BEFORE UPDATE ON kommuner
    FOR EACH ROW
    EXECUTE FUNCTION update_location_updated_at();

CREATE TRIGGER tettsteder_updated_at_trigger
    BEFORE UPDATE ON tettsteder
    FOR EACH ROW
    EXECUTE FUNCTION update_location_updated_at();

-- Insert fylker (counties) data based on 2024 structure
INSERT INTO fylker (fylke_nummer, navn) VALUES
('03', 'Oslo'),
('11', 'Rogaland'),
('15', 'More og Romsdal'),
('18', 'Nordland'),
('31', 'Ostfold'),
('32', 'Akershus'),
('33', 'Buskerud'),
('34', 'Innlandet'),
('39', 'Vestfold'),
('40', 'Telemark'),
('42', 'Agder'),
('46', 'Vestland'),
('50', 'Trondelag'),
('55', 'Troms'),
('56', 'Finnmark');

-- Insert some key kommuner (municipalities)
DO $$
DECLARE
    oslo_fylke_id UUID;
    rogaland_fylke_id UUID;
    more_romsdal_fylke_id UUID;
    nordland_fylke_id UUID;
    vestland_fylke_id UUID;
    trondelag_fylke_id UUID;
    troms_fylke_id UUID;
BEGIN
    -- Get fylke IDs
    SELECT id INTO oslo_fylke_id FROM fylker WHERE fylke_nummer = '03';
    SELECT id INTO rogaland_fylke_id FROM fylker WHERE fylke_nummer = '11';
    SELECT id INTO more_romsdal_fylke_id FROM fylker WHERE fylke_nummer = '15';
    SELECT id INTO nordland_fylke_id FROM fylker WHERE fylke_nummer = '18';
    SELECT id INTO vestland_fylke_id FROM fylker WHERE fylke_nummer = '46';
    SELECT id INTO trondelag_fylke_id FROM fylker WHERE fylke_nummer = '50';
    SELECT id INTO troms_fylke_id FROM fylker WHERE fylke_nummer = '55';
    
    -- Insert key municipalities for major cities
    INSERT INTO kommuner (kommune_nummer, navn, fylke_id) VALUES
    -- Oslo
    ('0301', 'Oslo', oslo_fylke_id),
    
    -- Rogaland
    ('1103', 'Stavanger', rogaland_fylke_id),
    ('1106', 'Haugesund', rogaland_fylke_id),
    ('1108', 'Sandnes', rogaland_fylke_id),
    
    -- More og Romsdal
    ('1502', 'Molde', more_romsdal_fylke_id),
    ('1504', 'Alesund', more_romsdal_fylke_id),
    
    -- Nordland
    ('1804', 'Bodo', nordland_fylke_id),
    
    -- Vestland
    ('4601', 'Bergen', vestland_fylke_id),
    
    -- Trondelag
    ('5001', 'Trondheim', trondelag_fylke_id),
    
    -- Troms
    ('5501', 'Tromso', troms_fylke_id);
END $$;

-- Add some tettsteder for major cities
DO $$
DECLARE
    oslo_kommune_id UUID;
    stavanger_kommune_id UUID;
    bergen_kommune_id UUID;
    trondheim_kommune_id UUID;
    tromso_kommune_id UUID;
BEGIN
    -- Get kommune IDs
    SELECT id INTO oslo_kommune_id FROM kommuner WHERE kommune_nummer = '0301';
    SELECT id INTO stavanger_kommune_id FROM kommuner WHERE kommune_nummer = '1103';
    SELECT id INTO bergen_kommune_id FROM kommuner WHERE kommune_nummer = '4601';
    SELECT id INTO trondheim_kommune_id FROM kommuner WHERE kommune_nummer = '5001';
    SELECT id INTO tromso_kommune_id FROM kommuner WHERE kommune_nummer = '5501';
    
    -- Insert major tettsteder
    INSERT INTO tettsteder (navn, kommune_id, tettsted_nummer) VALUES
    ('Oslo sentrum', oslo_kommune_id, '0301'),
    ('Stavanger sentrum', stavanger_kommune_id, '1103'),
    ('Bergen sentrum', bergen_kommune_id, '4601'),
    ('Trondheim sentrum', trondheim_kommune_id, '5001'),
    ('Tromso sentrum', tromso_kommune_id, '5501');
END $$;