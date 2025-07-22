-- Production seed script for pricing configuration
-- Uses Norwegian column names as they exist in production database

-- Clear existing pricing data (for production use)
DELETE FROM pricing_discounts;
DELETE FROM base_prices;

-- Insert base prices using Norwegian column names
INSERT INTO base_prices (id, name, grunnpris, description, er_aktiv, opprettet_dato, oppdatert_dato)
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
  );

-- Insert pricing discounts using Norwegian column names
INSERT INTO pricing_discounts (id, maaneder, rabatt_prosent, er_aktiv, opprettet_dato, oppdatert_dato)
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
  );

-- Verify the inserted data
SELECT 'Base Prices:' as section;
SELECT name, grunnpris as price, description FROM base_prices WHERE er_aktiv = true ORDER BY name;

SELECT 'Pricing Discounts:' as section;
SELECT maaneder as months, rabatt_prosent as percentage, er_aktiv as is_active FROM pricing_discounts WHERE er_aktiv = true ORDER BY maaneder;