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

-- Create diverse stables with advertising enabled
INSERT INTO public.stables (id, owner_id, name, description, location, address, poststed, postal_code, longitude, latitude, advertising_active, advertising_end_date, created_at, updated_at)
VALUES
  -- Oslo stables
  ('stable-oslo-1', '11111111-1111-1111-1111-111111111111', 'Oslo Ridesenter', 'Moderne ridesenter i Oslo med topp fasiliteter', 'Oslo', 'Maridalsveien 123', 'Oslo', '0178', 10.7522, 59.9139, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-oslo-2', '11111111-1111-1111-1111-111111111111', 'Ekeberg Stall', 'Koselig stall med flott utsikt over Oslo', 'Oslo', 'Ekebergveien 45', 'Oslo', '1181', 10.7830, 59.8997, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Akershus stables  
  ('stable-akershus-1', '11111111-1111-1111-1111-111111111111', 'Lørenskog Hestesenter', 'Stort anlegg med innendørs ridehall', 'Akershus', 'Gamleveien 88', 'Rasta', '1476', 10.9541, 59.9274, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-akershus-2', '11111111-1111-1111-1111-111111111111', 'Lillestrøm Rideklubb', 'Familievennlig rideklubb med god stemning', 'Akershus', 'Stallveien 12', 'Lillestrøm', '2000', 11.0493, 59.9559, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Rogaland stables
  ('stable-rogaland-1', '11111111-1111-1111-1111-111111111111', 'Stavanger Hestesport', 'Profesjonelt anlegg for konkurransehester', 'Rogaland', 'Hestehagen 77', 'Stavanger', '4014', 5.7321, 58.9690, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-rogaland-2', '11111111-1111-1111-1111-111111111111', 'Sandnes Rideskole', 'Trivelig rideskole med fokus på barn og ungdom', 'Rogaland', 'Rideveien 33', 'Sandnes', '4306', 5.7352, 58.8517, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Trøndelag stables
  ('stable-trondelag-1', '11111111-1111-1111-1111-111111111111', 'Trondheim Hestesenter', 'Moderne fasiliteter i Trondheim', 'Trøndelag', 'Hestmoveien 90', 'Trondheim', '7089', 10.3951, 63.4305, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-trondelag-2', '11111111-1111-1111-1111-111111111111', 'Stjørdal Stall og Rideskole', 'Rolig miljø perfekt for hobbyryttere', 'Trøndelag', 'Stallgata 15', 'Stjørdal', '7500', 10.9541, 63.4697, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Vestfold stables
  ('stable-vestfold-1', '11111111-1111-1111-1111-111111111111', 'Tønsberg Ridesenter', 'Historisk stall med moderne fasiliteter', 'Vestfold', 'Hestefaret 44', 'Tønsberg', '3126', 10.4078, 59.2678, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-vestfold-2', '11111111-1111-1111-1111-111111111111', 'Sandefjord Hestegård', 'Idyllisk gård med store beiter', 'Vestfold', 'Gårdsveien 28', 'Sandefjord', '3201', 10.2250, 59.1313, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW());

-- Update amenities with stable data
UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE', 'LUNSJERING']::stable_amenity[]
WHERE id = 'stable-oslo-1';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE', 'SOLARIUM']::stable_amenity[]
WHERE id = 'stable-oslo-2';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'VASKESPILT']::stable_amenity[]
WHERE id = 'stable-akershus-1';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'LUNSJERING']::stable_amenity[]
WHERE id = 'stable-akershus-2';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE', 'VASKESPILT']::stable_amenity[]
WHERE id = 'stable-rogaland-1';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE']::stable_amenity[]
WHERE id = 'stable-rogaland-2';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'SOLARIUM']::stable_amenity[]
WHERE id = 'stable-trondelag-1';

UPDATE stables SET 
  amenities = ARRAY['LUNSJERING']::stable_amenity[]
WHERE id = 'stable-trondelag-2';

UPDATE stables SET 
  amenities = ARRAY['RIDEHALL', 'UTENDORS_RIDEBANE']::stable_amenity[]
WHERE id = 'stable-vestfold-1';

UPDATE stables SET 
  amenities = ARRAY['UTENDORS_RIDEBANE', 'LUNSJERING']::stable_amenity[]
WHERE id = 'stable-vestfold-2';

-- Create diverse boxes with different attributes
INSERT INTO public.boxes (id, stable_id, name, description, size, price, available_from_date, box_type, max_horse_size, is_available, is_active, created_at, updated_at)
VALUES
  -- Oslo boxes (various sizes and prices)
  ('box-oslo-1', 'stable-oslo-1', 'Boks 1A', 'Lys og luftig boks', 9.0, 2500, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  ('box-oslo-2', 'stable-oslo-1', 'Boks 1B', 'Romslig hjørneboks', 12.25, 3500, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('box-oslo-3', 'stable-oslo-1', 'Utegang 1', 'Med ly og automatisk vann', 16.0, 1800, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('box-oslo-4', 'stable-oslo-2', 'Boks 2A', 'Nyrenovert boks', 8.4, 2200, CURRENT_DATE + INTERVAL '7 days', 'BOKS', 'LITEN_HEST', true, true, NOW(), NOW()),
  ('box-oslo-5', 'stable-oslo-2', 'Boks 2B', 'Stor boks med vindu', 18.0, 4500, CURRENT_DATE, 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  
  -- Akershus boxes (different price ranges)
  ('box-akershus-1', 'stable-akershus-1', 'Stall A1', 'Standard boks', 10.24, 2800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('box-akershus-2', 'stable-akershus-1', 'Stall A2', 'Boks med paddock', 12.25, 3200, CURRENT_DATE + INTERVAL '14 days', 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('box-akershus-3', 'stable-akershus-2', 'Ponniland 1', 'Perfekt for ponnier', 7.5, 1500, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  ('box-akershus-4', 'stable-akershus-2', 'Utegang Nord', 'Stort uteområde', 25.0, 1200, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  
  -- Rogaland boxes (premium pricing)
  ('box-rogaland-1', 'stable-rogaland-1', 'Elite 1', 'Premium boks for konkurransehest', 16.0, 5500, CURRENT_DATE, 'BOKS', 'STOR_HEST', false, true, NOW(), NOW()),
  ('box-rogaland-2', 'stable-rogaland-1', 'Elite 2', 'Luksus boks med gummimatte', 18.0, 6000, CURRENT_DATE + INTERVAL '30 days', 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  ('box-rogaland-3', 'stable-rogaland-2', 'Junior 1', 'For unge ryttere', 9.0, 2000, CURRENT_DATE, 'BOKS', 'LITEN_HEST', true, true, NOW(), NOW()),
  ('box-rogaland-4', 'stable-rogaland-2', 'Junior 2', 'Trygg ponniboks', 7.84, 1800, CURRENT_DATE, 'BOKS', 'PONNI', true, true, NOW(), NOW()),
  
  -- Trøndelag boxes (mixed availability)
  ('box-trondelag-1', 'stable-trondelag-1', 'Nordstall 1', 'Isolert vinterboks', 12.25, 3800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, true, NOW(), NOW()),
  ('box-trondelag-2', 'stable-trondelag-1', 'Nordstall 2', 'Med oppvarming', 14.0, 4200, CURRENT_DATE + INTERVAL '21 days', 'BOKS', 'STOR_HEST', true, true, NOW(), NOW()),
  ('box-trondelag-3', 'stable-trondelag-2', 'Sommerbeite 1', 'Stort beiteområde', 100.0, 1500, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('box-trondelag-4', 'stable-trondelag-2', 'Småhest 1', 'Koselig boks', 9.6, 2600, CURRENT_DATE, 'BOKS', 'LITEN_HEST', false, true, NOW(), NOW()),
  
  -- Vestfold boxes (various types)
  ('box-vestfold-1', 'stable-vestfold-1', 'Hovedstall A', 'Sentral plassering', 10.89, 3000, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('box-vestfold-2', 'stable-vestfold-1', 'Hovedstall B', 'Ved ridehallen', 12.25, 3400, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, true, NOW(), NOW()),
  ('box-vestfold-3', 'stable-vestfold-2', 'Gårdsbeite', 'Naturlig beite', 300.0, 1300, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', true, true, NOW(), NOW()),
  ('box-vestfold-4', 'stable-vestfold-2', 'Ponnistall', 'Liten men fin', 7.0, 1600, CURRENT_DATE + INTERVAL '10 days', 'BOKS', 'PONNI', false, true, NOW(), NOW()),
  ('box-vestfold-5', 'stable-vestfold-2', 'VIP Boks', 'Ekstra stor luksus', 20.0, 4800, CURRENT_DATE, 'BOKS', 'STOR_HEST', true, true, NOW(), NOW());

-- Update box amenities flags
UPDATE boxes SET has_water = true, has_window = false WHERE id = 'box-oslo-1';
UPDATE boxes SET has_water = true, has_window = true WHERE id = 'box-oslo-2';
UPDATE boxes SET has_water = true WHERE id = 'box-oslo-3';
UPDATE boxes SET has_window = true WHERE id = 'box-oslo-5';
UPDATE boxes SET has_water = true WHERE id = 'box-akershus-1';
UPDATE boxes SET has_window = true WHERE id = 'box-akershus-2';
UPDATE boxes SET has_water = true, has_window = true WHERE id IN ('box-rogaland-1', 'box-rogaland-2');
UPDATE boxes SET has_window = true WHERE id IN ('box-trondelag-1', 'box-trondelag-2');
UPDATE boxes SET has_water = true WHERE id IN ('box-trondelag-2', 'box-vestfold-1', 'box-vestfold-2');
UPDATE boxes SET has_water = true, has_window = true WHERE id = 'box-vestfold-5';

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
GROUP BY s.id, s.name, s.location, s.poststed, s.advertising_active, s.advertising_end_date
ORDER BY s.location, s.name;

-- Show box distribution
SELECT 
  s.location as county,
  COUNT(DISTINCT s.id) as stable_count,
  COUNT(b.id) as total_boxes,
  COUNT(CASE WHEN b.is_available = true THEN 1 END) as available_boxes,
  MIN(b.price) as min_price,
  MAX(b.price) as max_price,
  COUNT(CASE WHEN b.size < 10 THEN 1 END) as small_boxes,
  COUNT(CASE WHEN b.size >= 10 AND b.size < 15 THEN 1 END) as medium_boxes,
  COUNT(CASE WHEN b.size >= 15 THEN 1 END) as large_boxes
FROM stables s
LEFT JOIN boxes b ON s.id = b.stable_id
WHERE s.advertising_active = true
GROUP BY s.location
ORDER BY s.location;