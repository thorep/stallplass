-- Add location references to stables table for better geographical filtering
-- This links stables to the Norwegian administrative division system (fylker and kommuner)

-- Add fylke_id and kommune_id columns to stables table
ALTER TABLE stables 
ADD COLUMN fylke_id UUID REFERENCES fylker(id),
ADD COLUMN kommune_id UUID REFERENCES kommuner(id);

-- Create indexes for performance
CREATE INDEX idx_stables_fylke_id ON stables(fylke_id);
CREATE INDEX idx_stables_kommune_id ON stables(kommune_id);

-- Add comments for documentation
COMMENT ON COLUMN stables.fylke_id IS 'Reference to the fylke (county) where the stable is located';
COMMENT ON COLUMN stables.kommune_id IS 'Reference to the kommune (municipality) where the stable is located';