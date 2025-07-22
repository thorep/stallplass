-- Seed script for pricing configuration
-- Base prices and discounts for advertising and boost post listings

-- Clear existing pricing data (for production use)
DELETE FROM pricing_discounts;
DELETE FROM base_prices;

-- Insert base prices
INSERT INTO base_prices (id, name, price, description, is_active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'monthly',
    10, -- 10 kr per month (base advertising price)
    'Monthly base price per box listing',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'sponsored_placement',
    2, -- 2 kr per day (boost post price)
    'Daily price for sponsored placement per box',
    true,
    NOW(),
    NOW()
  )
-- Remove conflict handling since we're starting fresh
;

-- Insert pricing discounts for multi-month subscriptions  
INSERT INTO pricing_discounts (id, months, percentage, is_active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    1,
    0.0, -- No discount for 1 month
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    3,
    0.05, -- 5% discount for 3 months
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    6,
    0.12, -- 12% discount for 6 months
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    12,
    0.15, -- 15% discount for 12 months
    true,
    NOW(),
    NOW()
  )
-- Remove conflict handling since we're starting fresh
;

-- Verify the inserted data
SELECT 'Base Prices:' as section;
SELECT name, price, description FROM base_prices WHERE is_active = true ORDER BY name;

SELECT 'Pricing Discounts:' as section;
SELECT months, percentage, is_active FROM pricing_discounts WHERE is_active = true ORDER BY months;