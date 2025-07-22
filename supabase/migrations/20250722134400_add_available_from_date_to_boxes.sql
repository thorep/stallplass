-- Add available_from_date column to boxes table
-- This field will be used when a box is currently rented (is_available = false)
-- but the stable owner knows when it will become available again

ALTER TABLE public.boxes ADD COLUMN available_from_date DATE;

-- Add a helpful comment
COMMENT ON COLUMN public.boxes.available_from_date IS 'Date when a currently rented box will become available. NULL means no known availability date.';