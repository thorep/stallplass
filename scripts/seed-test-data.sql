-- Seed Test Data for user3@test.com and user4@test.com
-- This script creates comprehensive test data for testing the Stallplass application

-- First, create counties and municipalities data
INSERT INTO counties (id, name, county_number, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Oslo', '03', NOW(), NOW()),
  (gen_random_uuid(), 'Innlandet', '34', NOW(), NOW()),
  (gen_random_uuid(), 'Viken', '30', NOW(), NOW()),
  (gen_random_uuid(), 'Vestfold', '39', NOW(), NOW()),
  (gen_random_uuid(), 'Telemark', '40', NOW(), NOW()),
  (gen_random_uuid(), 'Agder', '42', NOW(), NOW()),
  (gen_random_uuid(), 'Rogaland', '11', NOW(), NOW()),
  (gen_random_uuid(), 'Vestland', '46', NOW(), NOW()),
  (gen_random_uuid(), 'Møre og Romsdal', '15', NOW(), NOW()),
  (gen_random_uuid(), 'Trøndelag', '50', NOW(), NOW()),
  (gen_random_uuid(), 'Nordland', '18', NOW(), NOW()),
  (gen_random_uuid(), 'Troms', '54', NOW(), NOW()),
  (gen_random_uuid(), 'Finnmark', '56', NOW(), NOW())
ON CONFLICT (county_number) DO NOTHING;

-- Create some major municipalities for testing
INSERT INTO municipalities (id, name, municipality_number, county_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  muni.name,
  muni.number,
  c.id,
  NOW(),
  NOW()
FROM (
  VALUES
    ('Oslo', '0301', '03'),
    ('Bergen', '4601', '46'),
    ('Trondheim', '5001', '50'),
    ('Stavanger', '1103', '11'),
    ('Kristiansand', '4204', '42'),
    ('Fredrikstad', '3001', '30'),
    ('Tromsø', '5401', '54'),
    ('Drammen', '3005', '30'),
    ('Bodø', '1804', '18'),
    ('Ålesund', '1507', '15')
) AS muni(name, number, county_number)
JOIN counties c ON c.county_number = muni.county_number
ON CONFLICT (municipality_number) DO NOTHING;

-- First, look up the user IDs for our test users
DO $$
DECLARE
  user3_id UUID;
  user4_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO user3_id FROM users WHERE email = 'user3@test.com';
  SELECT id INTO user4_id FROM users WHERE email = 'user4@test.com';
  
  -- Exit if users don't exist
  IF user3_id IS NULL OR user4_id IS NULL THEN
    RAISE EXCEPTION 'Test users user3@test.com and user4@test.com must exist before running this script';
  END IF;

  -- Create user profiles if they don't exist
  INSERT INTO users (id, email, name, phone, created_at, updated_at)
  VALUES
    (user3_id, 'user3@test.com', 'Test Stable Owner 3', '90000003', NOW(), NOW()),
    (user4_id, 'user4@test.com', 'Test Stable Owner 4', '90000004', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Create 5 stables for user3 with varying advertising status
  INSERT INTO stables (id, owner_id, name, description, location, address, postal_code, city, county_id, municipality_id, latitude, longitude, images, created_at, updated_at)
  SELECT
    stable_data.id,
    user3_id,
    stable_data.name,
    stable_data.description,
    stable_data.location,
    stable_data.address,
    stable_data.postal_code,
    stable_data.city,
    c.id as county_id,
    m.id as municipality_id,
    stable_data.latitude,
    stable_data.longitude,
    stable_data.images,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('test-stable-u3-1', 'Oslo Luksus Stall', 'Premium stall med alle fasiliteter i Oslo sentrum', 'Maridalsveien 200, 0178 Oslo', 'Maridalsveien 200', '0178', 'Oslo', '0301', 59.9139, 10.7522, ARRAY['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2']),
      ('test-stable-u3-2', 'Bergen Fjordstall', 'Idyllisk stall med fjordutsikt', 'Fjordveien 50, 5006 Bergen', 'Fjordveien 50', '5006', 'Bergen', '4601', 60.3913, 5.3221, ARRAY['https://picsum.photos/800/600?random=3']),
      ('test-stable-u3-3', 'Trondheim Historiske Stall', 'Tradisjonell stall med moderne touch', 'Gamleveien 15, 7089 Trondheim', 'Gamleveien 15', '7089', 'Trondheim', '5001', 63.4305, 10.3951, ARRAY['https://picsum.photos/800/600?random=4']),
      ('test-stable-u3-4', 'Stavanger Budget Stall', 'Rimelig alternativ for hobbyryttere', 'Hesteveien 88, 4014 Stavanger', 'Hesteveien 88', '4014', 'Stavanger', '1103', 58.9690, 5.7321, NULL),
      ('test-stable-u3-5', 'Kristiansand Familistall', 'Perfekt for familier med barn', 'Familieveien 25, 4614 Kristiansand', 'Familieveien 25', '4614', 'Kristiansand', '4204', 58.1599, 7.9956, ARRAY['https://picsum.photos/800/600?random=5'])
  ) AS stable_data(id, name, description, location, address, postal_code, city, municipality_number, latitude, longitude, images)
  JOIN municipalities m ON m.municipality_number = stable_data.municipality_number
  JOIN counties c ON c.id = m.county_id;

  -- Create 5 stables for user4 with varying advertising status
  INSERT INTO stables (id, owner_id, name, description, location, address, postal_code, city, county_id, municipality_id, latitude, longitude, images, created_at, updated_at)
  SELECT
    stable_data.id,
    user4_id,
    stable_data.name,
    stable_data.description,
    stable_data.location,
    stable_data.address,
    stable_data.postal_code,
    stable_data.city,
    c.id as county_id,
    m.id as municipality_id,
    stable_data.latitude,
    stable_data.longitude,
    stable_data.images,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('test-stable-u4-1', 'Fredrikstad Elite Stall', 'Konkurransestall for profesjonelle', 'Eliteveien 100, 1605 Fredrikstad', 'Eliteveien 100', '1605', 'Fredrikstad', '3001', 59.2181, 10.9298, ARRAY['https://picsum.photos/800/600?random=6', 'https://picsum.photos/800/600?random=7', 'https://picsum.photos/800/600?random=8']),
      ('test-stable-u4-2', 'Tromsø Nordlys Stall', 'Opplev nordlyset fra hesteryggen', 'Nordlysveien 30, 9008 Tromsø', 'Nordlysveien 30', '9008', 'Tromsø', '5401', 69.6492, 18.9553, ARRAY['https://picsum.photos/800/600?random=9']),
      ('test-stable-u4-3', 'Drammen Nær-By Stall', 'Sentralt og praktisk', 'Sentrumsveien 60, 3015 Drammen', 'Sentrumsveien 60', '3015', 'Drammen', '3005', 59.7378, 10.2050, NULL),
      ('test-stable-u4-4', 'Bodø Midnattssol Stall', 'Riding under midnattssolen', 'Solveien 75, 8003 Bodø', 'Solveien 75', '8003', 'Bodø', '1804', 67.2804, 14.4049, ARRAY['https://picsum.photos/800/600?random=10']),
      ('test-stable-u4-5', 'Ålesund Kyst Stall', 'Kystridning på sitt beste', 'Kystveien 40, 6002 Ålesund', 'Kystveien 40', '6002', 'Ålesund', '1507', 62.4722, 6.1549, NULL)
  ) AS stable_data(id, name, description, location, address, postal_code, city, municipality_number, latitude, longitude, images)
  JOIN municipalities m ON m.municipality_number = stable_data.municipality_number
  JOIN counties c ON c.id = m.county_id;

  -- Add stable amenities (mix of amenities for each stable)
  INSERT INTO stable_amenity_links (stable_id, amenity_id)
  SELECT s.stable_id, a.id
  FROM (
    VALUES
      -- User 3 stables
      ('test-stable-u3-1'), ('test-stable-u3-1'), ('test-stable-u3-1'), ('test-stable-u3-1'), ('test-stable-u3-1'),
      ('test-stable-u3-2'), ('test-stable-u3-2'), ('test-stable-u3-2'),
      ('test-stable-u3-3'), ('test-stable-u3-3'), ('test-stable-u3-3'), ('test-stable-u3-3'),
      ('test-stable-u3-4'), ('test-stable-u3-4'),
      ('test-stable-u3-5'), ('test-stable-u3-5'), ('test-stable-u3-5'), ('test-stable-u3-5'),
      -- User 4 stables
      ('test-stable-u4-1'), ('test-stable-u4-1'), ('test-stable-u4-1'), ('test-stable-u4-1'), ('test-stable-u4-1'), ('test-stable-u4-1'),
      ('test-stable-u4-2'), ('test-stable-u4-2'), ('test-stable-u4-2'),
      ('test-stable-u4-3'), ('test-stable-u4-3'), ('test-stable-u4-3'),
      ('test-stable-u4-4'), ('test-stable-u4-4'),
      ('test-stable-u4-5'), ('test-stable-u4-5'), ('test-stable-u4-5')
  ) AS s(stable_id),
  LATERAL (
    SELECT id FROM stable_amenities 
    WHERE stable_id = s.stable_id
    ORDER BY RANDOM() 
    LIMIT 1
  ) AS a
  ON CONFLICT DO NOTHING;

  -- Create 10 boxes for each stable (100 total) with varying options
  -- Price range: 3000-8000 NOK
  -- Mix of available/unavailable, indoor/outdoor, sponsored/not sponsored
  INSERT INTO boxes (id, stable_id, name, description, price, size, is_available, is_active, is_indoor, is_sponsored, sponsored_until, has_window, has_electricity, has_water, max_horse_size, box_type, images, created_at, updated_at)
  SELECT 
    'test-box-' || stable.id || '-' || box_num::text,
    stable.id,
    'Boks ' || box_num::text || ' - ' || 
      CASE 
        WHEN box_num <= 3 THEN 'Premium'
        WHEN box_num <= 7 THEN 'Standard'
        ELSE 'Budget'
      END,
    CASE 
      WHEN box_num <= 3 THEN 'Luksus boks med alle fasiliteter og ekstra plass'
      WHEN box_num <= 7 THEN 'Standard boks med grunnleggende fasiliteter'
      ELSE 'Enkel men funksjonell boks'
    END,
    -- Price based on box number
    CASE 
      WHEN box_num <= 3 THEN 6000 + (box_num * 500)
      WHEN box_num <= 7 THEN 4500 + (box_num * 200)
      ELSE 3000 + (box_num * 100)
    END,
    -- Size based on box type
    CASE 
      WHEN box_num <= 3 THEN 16.0
      WHEN box_num <= 7 THEN 12.0
      ELSE 9.0
    END,
    -- Availability: mix of available and unavailable
    CASE 
      WHEN box_num IN (2, 4, 7, 9) THEN false
      ELSE true
    END,
    true, -- is_active
    -- Indoor/outdoor mix
    CASE 
      WHEN box_num IN (1, 3, 5, 7, 9) THEN true
      ELSE false
    END,
    -- Sponsored boxes (only on stables with active advertising)
    CASE 
      WHEN stable.advertising_active = true AND box_num IN (1, 5) THEN true
      ELSE false
    END,
    -- Sponsored until
    CASE 
      WHEN stable.advertising_active = true AND box_num IN (1, 5) THEN CURRENT_DATE + INTERVAL '14 days'
      ELSE NULL
    END,
    -- Has window
    CASE 
      WHEN box_num <= 7 THEN true
      ELSE false
    END,
    -- Has electricity
    CASE 
      WHEN box_num <= 5 THEN true
      ELSE false
    END,
    -- Has water
    CASE 
      WHEN box_num <= 3 THEN true
      ELSE false
    END,
    -- Max horse size
    CASE 
      WHEN box_num <= 3 THEN 'large'
      WHEN box_num <= 7 THEN 'medium'
      ELSE 'small'
    END,
    -- Box type
    CASE 
      WHEN box_num IN (1, 3, 5, 7, 9) THEN 'BOKS'
      ELSE 'UTEGANG'
    END,
    -- Images
    CASE 
      WHEN box_num <= 3 THEN ARRAY['https://picsum.photos/800/600?random=' || (100 + box_num)::text, 'https://picsum.photos/800/600?random=' || (200 + box_num)::text]
      WHEN box_num <= 7 THEN ARRAY['https://picsum.photos/800/600?random=' || (300 + box_num)::text]
      ELSE NULL
    END,
    NOW(),
    NOW()
  FROM 
    stables stable,
    generate_series(1, 10) AS box_num
  WHERE 
    stable.id LIKE 'test-stable-%';

  -- Add box amenities (varying by box quality)
  INSERT INTO box_amenity_links (box_id, amenity_id)
  SELECT 
    b.id,
    ba.id
  FROM 
    boxes b
    CROSS JOIN box_amenities ba
  WHERE 
    b.id LIKE 'test-box-%'
    AND (
      -- Premium boxes get all amenities
      (b.name LIKE '%Premium%' AND ba.name IN ('Automatisk vannsystem', 'Oppvarming', 'Videoovervåkning', 'Gummimatter'))
      OR
      -- Standard boxes get some amenities
      (b.name LIKE '%Standard%' AND ba.name IN ('Automatisk vannsystem', 'Gummimatter'))
      OR
      -- Budget boxes get basic amenities
      (b.name LIKE '%Budget%' AND ba.name IN ('Gummimatter'))
    )
  ON CONFLICT DO NOTHING;

  -- Add some rentals to make certain boxes occupied
  INSERT INTO rentals (id, box_id, renter_id, stable_id, start_date, end_date, status, monthly_price, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    b.id,
    CASE 
      WHEN b.stable_id LIKE '%u3%' THEN user4_id
      ELSE user3_id
    END,
    b.stable_id,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '180 days',
    'ACTIVE',
    b.price,
    NOW(),
    NOW()
  FROM 
    boxes b
  WHERE 
    b.id LIKE 'test-box-%'
    AND b.is_available = false
    AND b.name LIKE '%Standard%';

  -- Add some reviews for variety
  INSERT INTO reviews (id, rental_id, reviewer_id, reviewee_id, rating, comment, created_at)
  SELECT 
    gen_random_uuid(),
    r.id,
    r.renter_id,
    s.owner_id,
    CASE 
      WHEN RANDOM() < 0.7 THEN 5
      WHEN RANDOM() < 0.9 THEN 4
      ELSE 3
    END,
    CASE 
      WHEN RANDOM() < 0.5 THEN 'Fantastisk stall med flotte fasiliteter!'
      WHEN RANDOM() < 0.8 THEN 'Meget fornøyd med oppholdet.'
      ELSE 'Greit nok, men kunne vært bedre.'
    END,
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30)
  FROM 
    rentals r
    JOIN stables s ON r.stable_id = s.id
  WHERE 
    r.status = 'ACTIVE'
    AND RANDOM() < 0.5; -- Only create reviews for 50% of rentals

END $$;

-- Update stable statistics
UPDATE stables s
SET 
  rating = COALESCE((
    SELECT AVG(rating)::numeric(2,1)
    FROM reviews r
    JOIN rentals rent ON r.rental_id = rent.id
    WHERE rent.stable_id = s.id
  ), 0),
  review_count = COALESCE((
    SELECT COUNT(*)
    FROM reviews r
    JOIN rentals rent ON r.rental_id = rent.id
    WHERE rent.stable_id = s.id
  ), 0)
WHERE s.id LIKE 'test-stable-%';

-- Add some test messages/conversations
DO $$
DECLARE
  user3_id UUID;
  user4_id UUID;
  conv_id UUID;
BEGIN
  SELECT id INTO user3_id FROM users WHERE email = 'user3@test.com';
  SELECT id INTO user4_id FROM users WHERE email = 'user4@test.com';

  -- Create a conversation between user3 and user4 about a box
  INSERT INTO conversations (id, participant1_id, participant2_id, box_id, stable_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    user3_id,
    user4_id,
    'test-box-test-stable-u3-1-1',
    'test-stable-u3-1',
    NOW() - INTERVAL '2 days',
    NOW()
  )
  RETURNING id INTO conv_id;

  -- Add some messages
  INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
  VALUES 
    (gen_random_uuid(), conv_id, user4_id, 'Hei! Jeg er interessert i Premium boks 1. Er den fortsatt ledig?', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), conv_id, user3_id, 'Hei! Ja, den er ledig. Vil du komme og se på den?', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
    (gen_random_uuid(), conv_id, user4_id, 'Det høres flott ut! Kan jeg komme i morgen kl 15?', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
    (gen_random_uuid(), conv_id, user3_id, 'Perfekt! Vi sees i morgen. Ring når du kommer.', NOW() - INTERVAL '2 days' + INTERVAL '3 hours');

END $$;

-- Summary of created test data
SELECT 'Test data created successfully!' as message;

SELECT 
  'Stables' as type,
  COUNT(*) as total,
  SUM(CASE WHEN advertising_active = true AND advertising_end_date > CURRENT_DATE THEN 1 ELSE 0 END) as with_active_advertising,
  SUM(CASE WHEN advertising_active = false OR advertising_end_date <= CURRENT_DATE THEN 1 ELSE 0 END) as without_advertising
FROM stables
WHERE id LIKE 'test-stable-%'

UNION ALL

SELECT 
  'Boxes' as type,
  COUNT(*) as total,
  SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_available = false THEN 1 ELSE 0 END) as unavailable
FROM boxes
WHERE id LIKE 'test-box-%'

UNION ALL

SELECT 
  'Active Rentals' as type,
  COUNT(*) as total,
  0 as placeholder1,
  0 as placeholder2
FROM rentals
WHERE stable_id LIKE 'test-stable-%' AND status = 'ACTIVE';