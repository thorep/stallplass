-- Seed script for comprehensive pricing configuration
-- This script seeds all pricing-related tables for the Stallplass platform
--
-- Tables seeded:
-- 1. base_prices: Core pricing (monthly base price, sponsored placement price)
-- 2. pricing_discounts: Time-based discounts (1, 3, 6, 12 month discounts)
-- 3. box_quantity_discounts: Volume discounts based on number of boxes
--
-- Pricing Structure:
-- - Base: 10 kr per box per month
-- - Sponsored: 2 kr per box per day 
-- - Volume discounts: 10% for 2-5 boxes, 15% for 6+ boxes
-- - Time discounts: 5% (3mo), 12% (6mo), 15% (12mo)

-- Clear existing pricing data (for production use)
DELETE FROM box_quantity_discounts;
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

-- Insert box quantity discounts
INSERT INTO box_quantity_discounts (id, min_boxes, max_boxes, discount_percentage, name, description, is_active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    1,
    1,
    0.0, -- No discount for single box
    'Single Box',
    'No discount for single box',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    2,
    5,
    10.0, -- 10% discount for 2-5 boxes
    'Small Stable',
    '10% discount for 2-5 boxes',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    6,
    null,
    15.0, -- 15% discount for 6+ boxes
    'Large Stable',
    '15% discount for 6 or more boxes',
    true,
    NOW(),
    NOW()
  );

-- Verify the inserted data
SELECT 'Base Prices:' as section;
SELECT name, price, description FROM base_prices WHERE is_active = true ORDER BY name;

SELECT 'Pricing Discounts:' as section;
SELECT months, percentage, is_active FROM pricing_discounts WHERE is_active = true ORDER BY months;

SELECT 'Box Quantity Discounts:' as section;
SELECT min_boxes, max_boxes, discount_percentage, name, description FROM box_quantity_discounts WHERE is_active = true ORDER BY min_boxes;