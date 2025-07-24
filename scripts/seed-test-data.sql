-- Seed Test Data for user3@test.com and user4@test.com
-- This script creates comprehensive test data for testing the Stallplass application

-- First, look up the user IDs for our test users
DO $$
DECLARE
  user3_id UUID;
  user4_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO user3_id FROM auth.users WHERE email = 'user3@test.com';
  SELECT id INTO user4_id FROM auth.users WHERE email = 'user4@test.com';
  
  -- Exit if users don't exist
  IF user3_id IS NULL OR user4_id IS NULL THEN
    RAISE EXCEPTION 'Test users user3@test.com and user4@test.com must exist before running this script';
  END IF;

  -- Create user profiles if they don't exist
  INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
  VALUES
    (user3_id, 'user3@test.com', 'Test Stable Owner 3', '90000003', NOW(), NOW()),
    (user4_id, 'user4@test.com', 'Test Stable Owner 4', '90000004', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Create 5 stables for user3 with varying advertising status
  INSERT INTO public.stables (id, owner_id, name, description, daily_care_included, location, municipality, poststed, fylke_id, kommune_id, latitude, longitude, advertising_active, advertising_end_date, images, created_at, updated_at)
  VALUES
    -- Active advertising, various locations
    ('test-stable-u3-1', user3_id, 'Oslo Luksus Stall', 'Premium stall med alle fasiliteter i Oslo sentrum', true, 'Maridalsveien 200, 0178 Oslo', 'Oslo', 'Oslo', '03', '0301', 59.9139, 10.7522, true, CURRENT_DATE + INTERVAL '60 days', ARRAY['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'], NOW(), NOW()),
    ('test-stable-u3-2', user3_id, 'Bergen Fjordstall', 'Idyllisk stall med fjordutsikt', false, 'Fjordveien 50, 5006 Bergen', 'Bergen', 'Bergen', '46', '4601', 60.3913, 5.3221, true, CURRENT_DATE + INTERVAL '30 days', ARRAY['https://picsum.photos/800/600?random=3'], NOW(), NOW()),
    
    -- Expired advertising
    ('test-stable-u3-3', user3_id, 'Trondheim Historiske Stall', 'Tradisjonell stall med moderne touch', true, 'Gamleveien 15, 7089 Trondheim', 'Trondheim', 'Trondheim', '50', '5001', 63.4305, 10.3951, true, CURRENT_DATE - INTERVAL '10 days', ARRAY['https://picsum.photos/800/600?random=4'], NOW(), NOW()),
    
    -- No advertising
    ('test-stable-u3-4', user3_id, 'Stavanger Budget Stall', 'Rimelig alternativ for hobbyryttere', false, 'Hesteveien 88, 4014 Stavanger', 'Stavanger', 'Stavanger', '11', '1103', 58.9690, 5.7321, false, NULL, NULL, NOW(), NOW()),
    ('test-stable-u3-5', user3_id, 'Kristiansand Familistall', 'Perfekt for familier med barn', true, 'Familieveien 25, 4614 Kristiansand', 'Kristiansand', 'Kristiansand', '42', '4204', 58.1599, 7.9956, false, NULL, ARRAY['https://picsum.photos/800/600?random=5'], NOW(), NOW());

  -- Create 5 stables for user4 with varying advertising status
  INSERT INTO public.stables (id, owner_id, name, description, daily_care_included, location, municipality, poststed, fylke_id, kommune_id, latitude, longitude, advertising_active, advertising_end_date, images, created_at, updated_at)
  VALUES
    -- Active advertising
    ('test-stable-u4-1', user4_id, 'Fredrikstad Elite Stall', 'Konkurransestall for profesjonelle', true, 'Eliteveien 100, 1605 Fredrikstad', 'Fredrikstad', 'Fredrikstad', '30', '3003', 59.2181, 10.9298, true, CURRENT_DATE + INTERVAL '90 days', ARRAY['https://picsum.photos/800/600?random=6', 'https://picsum.photos/800/600?random=7', 'https://picsum.photos/800/600?random=8'], NOW(), NOW()),
    ('test-stable-u4-2', user4_id, 'Tromsø Nordlys Stall', 'Opplev nordlyset fra hesteryggen', false, 'Nordlysveien 30, 9008 Tromsø', 'Tromsø', 'Tromsø', '54', '5401', 69.6492, 18.9553, true, CURRENT_DATE + INTERVAL '45 days', ARRAY['https://picsum.photos/800/600?random=9'], NOW(), NOW()),
    
    -- Soon expiring advertising
    ('test-stable-u4-3', user4_id, 'Drammen Nær-By Stall', 'Sentralt og praktisk', true, 'Sentrumsveien 60, 3015 Drammen', 'Drammen', 'Drammen', '30', '3005', 59.7378, 10.2050, true, CURRENT_DATE + INTERVAL '5 days', NULL, NOW(), NOW()),
    
    -- No advertising
    ('test-stable-u4-4', user4_id, 'Bodø Midnattssol Stall', 'Riding under midnattssolen', false, 'Solveien 75, 8003 Bodø', 'Bodø', 'Bodø', '18', '1804', 67.2804, 14.4049, false, NULL, ARRAY['https://picsum.photos/800/600?random=10'], NOW(), NOW()),
    ('test-stable-u4-5', user4_id, 'Ålesund Kyst Stall', 'Kystridning på sitt beste', true, 'Kystveien 40, 6002 Ålesund', 'Ålesund', 'Ålesund', '15', '1504', 62.4722, 6.1549, false, NULL, NULL, NOW(), NOW());

  -- Add stable amenities (mix of amenities for each stable)
  INSERT INTO public.stable_amenity_links (stable_id, amenity_id)
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
    SELECT id FROM public.stable_amenities 
    WHERE stable_id = s.stable_id
    ORDER BY RANDOM() 
    LIMIT 1
  ) AS a
  ON CONFLICT DO NOTHING;

  -- Create 10 boxes for each stable (100 total) with varying options
  -- Price range: 3000-8000 NOK
  -- Mix of available/unavailable, indoor/outdoor, sponsored/not sponsored
  INSERT INTO public.boxes (id, stable_id, name, description, price, size, is_available, is_active, is_indoor, is_sponsored, sponsored_until, has_window, has_electricity, has_water, max_horse_size, box_type, images, created_at, updated_at)
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
    public.stables stable,
    generate_series(1, 10) AS box_num
  WHERE 
    stable.id LIKE 'test-stable-%';

  -- Add box amenities (varying by box quality)
  INSERT INTO public.box_amenity_links (box_id, amenity_id)
  SELECT 
    b.id,
    ba.id
  FROM 
    public.boxes b
    CROSS JOIN public.box_amenities ba
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
  INSERT INTO public.rentals (id, box_id, renter_id, stable_id, start_date, end_date, status, monthly_price, created_at, updated_at)
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
    public.boxes b
  WHERE 
    b.id LIKE 'test-box-%'
    AND b.is_available = false
    AND b.name LIKE '%Standard%';

  -- Add some reviews for variety
  INSERT INTO public.reviews (id, rental_id, reviewer_id, reviewee_id, rating, comment, created_at)
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
    public.rentals r
    JOIN public.stables s ON r.stable_id = s.id
  WHERE 
    r.status = 'ACTIVE'
    AND RANDOM() < 0.5; -- Only create reviews for 50% of rentals

END $$;

-- Update stable statistics
UPDATE public.stables s
SET 
  rating = COALESCE((
    SELECT AVG(rating)::numeric(2,1)
    FROM public.reviews r
    JOIN public.rentals rent ON r.rental_id = rent.id
    WHERE rent.stable_id = s.id
  ), 0),
  review_count = COALESCE((
    SELECT COUNT(*)
    FROM public.reviews r
    JOIN public.rentals rent ON r.rental_id = rent.id
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
  SELECT id INTO user3_id FROM auth.users WHERE email = 'user3@test.com';
  SELECT id INTO user4_id FROM auth.users WHERE email = 'user4@test.com';

  -- Create a conversation between user3 and user4 about a box
  INSERT INTO public.conversations (id, participant1_id, participant2_id, box_id, stable_id, created_at, updated_at)
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
  INSERT INTO public.messages (id, conversation_id, sender_id, content, created_at)
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
FROM public.stables
WHERE id LIKE 'test-stable-%'

UNION ALL

SELECT 
  'Boxes' as type,
  COUNT(*) as total,
  SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN is_available = false THEN 1 ELSE 0 END) as unavailable
FROM public.boxes
WHERE id LIKE 'test-box-%'

UNION ALL

SELECT 
  'Active Rentals' as type,
  COUNT(*) as total,
  0 as placeholder1,
  0 as placeholder2
FROM public.rentals
WHERE stable_id LIKE 'test-stable-%' AND status = 'ACTIVE';