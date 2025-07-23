-- Create test users first
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create user profiles
INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com', 'Test User 1', '91234567', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com', 'Test User 2', '98765432', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Create diverse stables with advertising enabled using proper UUIDs
INSERT INTO public.stables (id, owner_id, name, description, location, address, poststed, postal_code, longitude, latitude, advertising_active, advertising_end_date, created_at, updated_at)
VALUES
  -- Oslo stables
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Oslo Ridesenter', 'Moderne ridesenter i Oslo med topp fasiliteter', 'Oslo', 'Maridalsveien 123', 'Oslo', '0178', 10.7522, 59.9139, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Ekeberg Stall', 'Koselig stall med flott utsikt over Oslo', 'Oslo', 'Ekebergveien 45', 'Oslo', '1181', 10.7830, 59.8997, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Akershus stables  
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Lørenskog Hestesenter', 'Stort anlegg med innendørs ridehall', 'Akershus', 'Gamleveien 88', 'Rasta', '1476', 10.9541, 59.9274, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Lillestrøm Rideklubb', 'Familievennlig rideklubb med god stemning', 'Akershus', 'Stallveien 12', 'Lillestrøm', '2000', 11.0493, 59.9559, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Rogaland stables
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Stavanger Hestesport', 'Profesjonelt anlegg for konkurransehester', 'Rogaland', 'Hestehagen 77', 'Stavanger', '4014', 5.7321, 58.9690, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Sandnes Rideskole', 'Trivelig rideskole med fokus på barn og ungdom', 'Rogaland', 'Rideveien 33', 'Sandnes', '4306', 5.7352, 58.8517, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Trøndelag stables
  ('a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Trondheim Hestesenter', 'Moderne fasiliteter i Trondheim', 'Trøndelag', 'Hestmoveien 90', 'Trondheim', '7089', 10.3951, 63.4305, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Stjørdal Stall og Rideskole', 'Rolig miljø perfekt for hobbyryttere', 'Trøndelag', 'Stallgata 15', 'Stjørdal', '7500', 10.9541, 63.4697, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Vestfold stables
  ('a9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Tønsberg Ridesenter', 'Historisk stall med moderne fasiliteter', 'Vestfold', 'Hestefaret 44', 'Tønsberg', '3126', 10.4078, 59.2678, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Sandefjord Hestegård', 'Idyllisk gård med store beiter', 'Vestfold', 'Gårdsveien 28', 'Sandefjord', '3201', 10.2250, 59.1313, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW());

-- Update amenities with stable data
UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE', 'LUNSJERING']::stable_amenity[]
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE', 'SOLARIUM']::stable_amenity[]
WHERE id = 'a2222222-2222-2222-2222-222222222222';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'VASKESPILT']::stable_amenity[]
WHERE id = 'a3333333-3333-3333-3333-333333333333';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'LUNSJERING']::stable_amenity[]
WHERE id = 'a4444444-4444-4444-4444-444444444444';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE', 'VASKESPILT']::stable_amenity[]
WHERE id = 'a5555555-5555-5555-5555-555555555555';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE']::stable_amenity[]
WHERE id = 'a6666666-6666-6666-6666-666666666666';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'SOLARIUM']::stable_amenity[]
WHERE id = 'a7777777-7777-7777-7777-777777777777';

UPDATE stables SET 
  amenities = ARRAY['LUNSJERING']::stable_amenity[]
WHERE id = 'a8888888-8888-8888-8888-888888888888';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE']::stable_amenity[]
WHERE id = 'a9999999-9999-9999-9999-999999999999';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE', 'LUNSJERING']::stable_amenity[]
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Create diverse boxes with different attributes
INSERT INTO public.boxes (id, stable_id, name, description, size, price, available_from_date, box_type, max_horse_size, is_available, is_active, created_at, updated_at)
VALUES
  -- Oslo boxes (various sizes and prices)
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Boks 1A', 'Lys og luftig boks', 9.0, 2500, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  ('b1111111-1111-1111-1111-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Boks 1B', 'Romslig hjørneboks', 12.25, 3500, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('b1111111-1111-1111-1111-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Utegang 1', 'Med ly og automatisk vann', 16.0, 1800, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('b2222222-2222-2222-2222-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Boks 2A', 'Nyrenovert boks', 8.4, 2200, CURRENT_DATE + INTERVAL '7 days', 'BOKS', 'LITEN_HEST', true, true, NOW(), NOW()),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Boks 2B', 'Stor boks med vindu', 18.0, 4500, CURRENT_DATE, 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  
  -- Akershus boxes (different price ranges)
  ('b3333333-3333-3333-3333-111111111111', 'a3333333-3333-3333-3333-333333333333', 'Stall A1', 'Standard boks', 10.24, 2800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('b3333333-3333-3333-3333-222222222222', 'a3333333-3333-3333-3333-333333333333', 'Stall A2', 'Boks med paddock', 12.25, 3200, CURRENT_DATE + INTERVAL '14 days', 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('b4444444-4444-4444-4444-111111111111', 'a4444444-4444-4444-4444-444444444444', 'Ponniland 1', 'Perfekt for ponnier', 7.5, 1500, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  ('b4444444-4444-4444-4444-222222222222', 'a4444444-4444-4444-4444-444444444444', 'Utegang Nord', 'Stort uteområde', 25.0, 1200, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  
  -- Rogaland boxes (premium pricing)
  ('b5555555-5555-5555-5555-111111111111', 'a5555555-5555-5555-5555-555555555555', 'Elite 1', 'Premium boks for konkurransehest', 16.0, 5500, CURRENT_DATE, 'BOKS', 'STOR_HEST', false, true, NOW(), NOW()),
  ('b5555555-5555-5555-5555-222222222222', 'a5555555-5555-5555-5555-555555555555', 'Elite 2', 'Luksus boks med gummimatte', 18.0, 6000, CURRENT_DATE + INTERVAL '30 days', 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  ('b6666666-6666-6666-6666-111111111111', 'a6666666-6666-6666-6666-666666666666', 'Junior 1', 'For unge ryttere', 9.0, 2000, CURRENT_DATE, 'BOKS', 'LITEN_HEST', true, true, NOW(), NOW()),
  ('b6666666-6666-6666-6666-222222222222', 'a6666666-6666-6666-6666-666666666666', 'Junior 2', 'Trygg ponniboks', 7.84, 1800, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  
  -- Trøndelag boxes (mixed availability)
  ('b7777777-7777-7777-7777-111111111111', 'a7777777-7777-7777-7777-777777777777', 'Nordstall 1', 'Isolert vinterboks', 12.25, 3800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('b7777777-7777-7777-7777-222222222222', 'a7777777-7777-7777-7777-777777777777', 'Nordstall 2', 'Med oppvarming', 14.0, 4200, CURRENT_DATE + INTERVAL '21 days', 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  ('b8888888-8888-8888-8888-111111111111', 'a8888888-8888-8888-8888-888888888888', 'Sommerbeite 1', 'Stort beiteområde', 100.0, 1500, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('b8888888-8888-8888-8888-222222222222', 'a8888888-8888-8888-8888-888888888888', 'Småhest 1', 'Koselig boks', 9.6, 2600, CURRENT_DATE, 'BOKS', 'LITEN_HEST', false, true, NOW(), NOW()),
  
  -- Vestfold boxes (various types)
  ('b9999999-9999-9999-9999-111111111111', 'a9999999-9999-9999-9999-999999999999', 'Hovedstall A', 'Sentral plassering', 10.89, 3000, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('b9999999-9999-9999-9999-222222222222', 'a9999999-9999-9999-9999-999999999999', 'Hovedstall B', 'Ved ridehallen', 12.25, 3400, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('baaaaaaa-aaaa-aaaa-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gårdsbeite', 'Naturlig beite', 300.0, 1300, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('baaaaaaa-aaaa-aaaa-aaaa-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ponnistall', 'Liten men fin', 7.0, 1600, CURRENT_DATE + INTERVAL '10 days', 'BOKS', 'PONNI', false, true, NOW(), NOW()),
  ('baaaaaaa-aaaa-aaaa-aaaa-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VIP Boks', 'Ekstra stor luksus', 20.0, 4800, CURRENT_DATE, 'BOKS', 'STOR_HEST', true, true, NOW(), NOW());

-- Update box amenities flags
UPDATE boxes SET has_water = true, has_window = false WHERE id = 'b1111111-1111-1111-1111-111111111111';
UPDATE boxes SET has_water = true, has_window = true WHERE id = 'b1111111-1111-1111-1111-222222222222';
UPDATE boxes SET has_water = true WHERE id = 'b1111111-1111-1111-1111-333333333333';
UPDATE boxes SET has_window = true WHERE id = 'b2222222-2222-2222-2222-222222222222';
UPDATE boxes SET has_water = true WHERE id = 'b3333333-3333-3333-3333-111111111111';
UPDATE boxes SET has_window = true WHERE id = 'b3333333-3333-3333-3333-222222222222';
UPDATE boxes SET has_water = true, has_window = true WHERE id IN ('b5555555-5555-5555-5555-111111111111', 'b5555555-5555-5555-5555-222222222222');
UPDATE boxes SET has_window = true WHERE id IN ('b7777777-7777-7777-7777-111111111111', 'b7777777-7777-7777-7777-222222222222');
UPDATE boxes SET has_water = true WHERE id IN ('b7777777-7777-7777-7777-222222222222', 'b9999999-9999-9999-9999-111111111111', 'b9999999-9999-9999-9999-222222222222');
UPDATE boxes SET has_water = true, has_window = true WHERE id = 'baaaaaaa-aaaa-aaaa-aaaa-333333333333';

-- Update total_boxes count for each stable
UPDATE stables s
SET total_boxes = (
  SELECT COUNT(*) 
  FROM boxes b 
  WHERE b.stable_id = s.id
);

-- Verify the data
SELECT 
  s.name as stable_name,
  s.location as county,
  s.poststed as city,
  s.advertising_active,
  s.advertising_end_date,
  COUNT(b.id) as box_count,
  COUNT(CASE WHEN b.is_available = true THEN 1 END) as available_boxes
FROM stables s
LEFT JOIN boxes b ON s.id = b.stable_id
WHERE s.advertising_active = true
GROUP BY s.id, s.name, s.location, s.poststed, s.advertising_active, s.advertising_end_date
ORDER BY s.location, s.name;

-- Show box distribution
SELECT 
  s.location as county,
  COUNT(DISTINCT s.id) as stable_count,
  COUNT(b.id) as total_boxes,
  COUNT(CASE WHEN b.is_available = true THEN 1 END) as available_boxes,
  MIN(b.price)::integer as min_price,
  MAX(b.price)::integer as max_price,
  COUNT(CASE WHEN b.size < 10 THEN 1 END) as small_boxes,
  COUNT(CASE WHEN b.size >= 10 AND b.size < 15 THEN 1 END) as medium_boxes,
  COUNT(CASE WHEN b.size >= 15 THEN 1 END) as large_boxes
FROM stables s
LEFT JOIN boxes b ON s.id = b.stable_id
WHERE s.advertising_active = true
GROUP BY s.location
ORDER BY s.location;

-- Show filter-specific statistics
SELECT 
  'Available Boxes' as filter_type,
  COUNT(*) as count
FROM boxes b
JOIN stables s ON b.stable_id = s.id
WHERE s.advertising_active = true AND b.is_available = true AND b.is_active = true
UNION ALL
SELECT 
  'Box Type: ' || box_type,
  COUNT(*)
FROM boxes b
JOIN stables s ON b.stable_id = s.id
WHERE s.advertising_active = true AND b.is_active = true
GROUP BY box_type
UNION ALL
SELECT 
  'Horse Size: ' || max_horse_size,
  COUNT(*)
FROM boxes b
JOIN stables s ON b.stable_id = s.id
WHERE s.advertising_active = true AND b.is_active = true AND max_horse_size IS NOT NULL
GROUP BY max_horse_size
UNION ALL
SELECT 
  'Has Water',
  COUNT(*)
FROM boxes b
JOIN stables s ON b.stable_id = s.id
WHERE s.advertising_active = true AND b.is_active = true AND b.has_water = true
UNION ALL
SELECT 
  'Has Window',
  COUNT(*)
FROM boxes b
JOIN stables s ON b.stable_id = s.id
WHERE s.advertising_active = true AND b.is_active = true AND b.has_window = true;