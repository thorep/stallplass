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
INSERT INTO public.stables (id, user_id, name, description, daily_care_included, address_line, address_postal_code, address_city, municipality_code, longitude, latitude, advertising_active, advertising_end_date, created_at, updated_at)
VALUES
  -- Oslo stables
  ('stable-oslo-1', '11111111-1111-1111-1111-111111111111', 'Oslo Ridesenter', 'Moderne ridesenter i Oslo med topp fasiliteter', true, 'Maridalsveien 123', '0178', 'Oslo', '0301', 10.7522, 59.9139, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-oslo-2', '11111111-1111-1111-1111-111111111111', 'Ekeberg Stall', 'Koselig stall med flott utsikt over Oslo', false, 'Ekebergveien 45', '1181', 'Oslo', '0301', 10.7830, 59.8997, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Akershus stables  
  ('stable-akershus-1', '11111111-1111-1111-1111-111111111111', 'Lørenskog Hestesenter', 'Stort anlegg med innendørs ridehall', true, 'Gamleveien 88', '1476', 'Rasta', '3029', 10.9541, 59.9274, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-akershus-2', '11111111-1111-1111-1111-111111111111', 'Lillestrøm Rideklubb', 'Familievennlig rideklubb med god stemning', true, 'Stallveien 12', '2000', 'Lillestrøm', '3030', 11.0493, 59.9559, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Rogaland stables
  ('stable-rogaland-1', '11111111-1111-1111-1111-111111111111', 'Stavanger Hestesport', 'Profesjonelt anlegg for konkurransehester', false, 'Hestehagen 77', '4014', 'Stavanger', '1103', 5.7321, 58.9690, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-rogaland-2', '11111111-1111-1111-1111-111111111111', 'Sandnes Rideskole', 'Trivelig rideskole med fokus på barn og ungdom', true, 'Rideveien 33', '4306', 'Sandnes', '1108', 5.7352, 58.8517, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Trøndelag stables
  ('stable-trondelag-1', '11111111-1111-1111-1111-111111111111', 'Trondheim Hestesenter', 'Moderne fasiliteter i Trondheim', true, 'Hestmoveien 90', '7089', 'Trondheim', '5001', 10.3951, 63.4305, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-trondelag-2', '11111111-1111-1111-1111-111111111111', 'Stjørdal Stall og Rideskole', 'Rolig miljø perfekt for hobbyryttere', false, 'Stallgata 15', '7500', 'Stjørdal', '5035', 10.9541, 63.4697, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  
  -- Vestfold stables
  ('stable-vestfold-1', '11111111-1111-1111-1111-111111111111', 'Tønsberg Ridesenter', 'Historisk stall med moderne fasiliteter', true, 'Hestefaret 44', '3126', 'Tønsberg', '3803', 10.4078, 59.2678, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
  ('stable-vestfold-2', '11111111-1111-1111-1111-111111111111', 'Sandefjord Hestegård', 'Idyllisk gård med store beiter', false, 'Gårdsveien 28', '3201', 'Sandefjord', '3804', 10.2250, 59.1313, true, CURRENT_DATE + INTERVAL '30 days', NOW(), NOW());

-- Create stable amenities
INSERT INTO public.stable_amenities (stable_id, amenity)
SELECT stable_id, amenity
FROM (
  VALUES
    ('stable-oslo-1', 'RIDEHALL'),
    ('stable-oslo-1', 'UTENDORS_RIDEBANE'),
    ('stable-oslo-1', 'LUNSJERING'),
    ('stable-oslo-2', 'UTENDORS_RIDEBANE'),
    ('stable-oslo-2', 'SOLARIUM'),
    ('stable-akershus-1', 'RIDEHALL'),
    ('stable-akershus-1', 'VASKESPILT'),
    ('stable-akershus-2', 'RIDEHALL'),
    ('stable-akershus-2', 'LUNSJERING'),
    ('stable-rogaland-1', 'RIDEHALL'),
    ('stable-rogaland-1', 'UTENDORS_RIDEBANE'),
    ('stable-rogaland-1', 'VASKESPILT'),
    ('stable-rogaland-2', 'UTENDORS_RIDEBANE'),
    ('stable-trondelag-1', 'RIDEHALL'),
    ('stable-trondelag-1', 'SOLARIUM'),
    ('stable-trondelag-2', 'LUNSJERING'),
    ('stable-vestfold-1', 'RIDEHALL'),
    ('stable-vestfold-1', 'UTENDORS_RIDEBANE'),
    ('stable-vestfold-2', 'UTENDORS_RIDEBANE'),
    ('stable-vestfold-2', 'LUNSJERING')
) AS t(stable_id, amenity);

-- Create diverse boxes with different attributes
INSERT INTO public.boxes (id, stable_id, name, description, width, length, area, monthly_price, availability_date, box_type, suitable_for, is_occupied, created_at, updated_at)
VALUES
  -- Oslo boxes (various sizes and prices)
  ('box-oslo-1', 'stable-oslo-1', 'Boks 1A', 'Lys og luftig boks', 3.0, 3.0, 9.0, 2500, CURRENT_DATE, 'BOKS', 'PONNI', false, NOW(), NOW()),
  ('box-oslo-2', 'stable-oslo-1', 'Boks 1B', 'Romslig hjørneboks', 3.5, 3.5, 12.25, 3500, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, NOW(), NOW()),
  ('box-oslo-3', 'stable-oslo-1', 'Utegang 1', 'Med ly og automatisk vann', 4.0, 4.0, 16.0, 1800, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', false, NOW(), NOW()),
  ('box-oslo-4', 'stable-oslo-2', 'Boks 2A', 'Nyrenovert boks', 3.0, 2.8, 8.4, 2200, CURRENT_DATE + INTERVAL '7 days', 'BOKS', 'LITEN_HEST', false, NOW(), NOW()),
  ('box-oslo-5', 'stable-oslo-2', 'Boks 2B', 'Stor boks med vindu', 4.0, 4.5, 18.0, 4500, CURRENT_DATE, 'BOKS', 'STOR_HEST', false, NOW(), NOW()),
  
  -- Akershus boxes (different price ranges)
  ('box-akershus-1', 'stable-akershus-1', 'Stall A1', 'Standard boks', 3.2, 3.2, 10.24, 2800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, NOW(), NOW()),
  ('box-akershus-2', 'stable-akershus-1', 'Stall A2', 'Boks med paddock', 3.5, 3.5, 12.25, 3200, CURRENT_DATE + INTERVAL '14 days', 'BOKS', 'MIDDELS_HEST', true, NOW(), NOW()),
  ('box-akershus-3', 'stable-akershus-2', 'Ponniland 1', 'Perfekt for ponnier', 2.5, 3.0, 7.5, 1500, CURRENT_DATE, 'BOKS', 'PONNI', false, NOW(), NOW()),
  ('box-akershus-4', 'stable-akershus-2', 'Utegang Nord', 'Stort uteområde', 5.0, 5.0, 25.0, 1200, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', false, NOW(), NOW()),
  
  -- Rogaland boxes (premium pricing)
  ('box-rogaland-1', 'stable-rogaland-1', 'Elite 1', 'Premium boks for konkurransehest', 4.0, 4.0, 16.0, 5500, CURRENT_DATE, 'BOKS', 'STOR_HEST', true, NOW(), NOW()),
  ('box-rogaland-2', 'stable-rogaland-1', 'Elite 2', 'Luksus boks med gummimatte', 4.5, 4.0, 18.0, 6000, CURRENT_DATE + INTERVAL '30 days', 'BOKS', 'STOR_HEST', false, NOW(), NOW()),
  ('box-rogaland-3', 'stable-rogaland-2', 'Junior 1', 'For unge ryttere', 3.0, 3.0, 9.0, 2000, CURRENT_DATE, 'BOKS', 'LITEN_HEST', false, NOW(), NOW()),
  ('box-rogaland-4', 'stable-rogaland-2', 'Junior 2', 'Trygg ponniboks', 2.8, 2.8, 7.84, 1800, CURRENT_DATE, 'BOKS', 'PONNI', false, NOW(), NOW()),
  
  -- Trøndelag boxes (mixed availability)
  ('box-trondelag-1', 'stable-trondelag-1', 'Nordstall 1', 'Isolert vinterboks', 3.5, 3.5, 12.25, 3800, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', true, NOW(), NOW()),
  ('box-trondelag-2', 'stable-trondelag-1', 'Nordstall 2', 'Med oppvarming', 3.5, 4.0, 14.0, 4200, CURRENT_DATE + INTERVAL '21 days', 'BOKS', 'STOR_HEST', false, NOW(), NOW()),
  ('box-trondelag-3', 'stable-trondelag-2', 'Sommerbeite 1', 'Stort beiteområde', 10.0, 10.0, 100.0, 1500, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', false, NOW(), NOW()),
  ('box-trondelag-4', 'stable-trondelag-2', 'Småhest 1', 'Koselig boks', 3.0, 3.2, 9.6, 2600, CURRENT_DATE, 'BOKS', 'LITEN_HEST', true, NOW(), NOW()),
  
  -- Vestfold boxes (various types)
  ('box-vestfold-1', 'stable-vestfold-1', 'Hovedstall A', 'Sentral plassering', 3.3, 3.3, 10.89, 3000, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, NOW(), NOW()),
  ('box-vestfold-2', 'stable-vestfold-1', 'Hovedstall B', 'Ved ridehallen', 3.5, 3.5, 12.25, 3400, CURRENT_DATE, 'BOKS', 'MIDDELS_HEST', false, NOW(), NOW()),
  ('box-vestfold-3', 'stable-vestfold-2', 'Gårdsbeite', 'Naturlig beite', 15.0, 20.0, 300.0, 1300, CURRENT_DATE, 'UTEGANG', 'STOR_HEST', false, NOW(), NOW()),
  ('box-vestfold-4', 'stable-vestfold-2', 'Ponnistall', 'Liten men fin', 2.5, 2.8, 7.0, 1600, CURRENT_DATE + INTERVAL '10 days', 'BOKS', 'PONNI', true, NOW(), NOW()),
  ('box-vestfold-5', 'stable-vestfold-2', 'VIP Boks', 'Ekstra stor luksus', 5.0, 4.0, 20.0, 4800, CURRENT_DATE, 'BOKS', 'STOR_HEST', false, NOW(), NOW());

-- Create box amenities for variety
INSERT INTO public.box_amenities (box_id, amenity)
SELECT box_id, amenity
FROM (
  VALUES
    ('box-oslo-1', 'AUTOMATISK_VANN'),
    ('box-oslo-2', 'VINDU'),
    ('box-oslo-2', 'AUTOMATISK_VANN'),
    ('box-oslo-3', 'PADDOCK'),
    ('box-oslo-5', 'VINDU'),
    ('box-oslo-5', 'GUMMIMATTE'),
    ('box-akershus-1', 'AUTOMATISK_VANN'),
    ('box-akershus-2', 'PADDOCK'),
    ('box-akershus-2', 'VINDU'),
    ('box-rogaland-1', 'GUMMIMATTE'),
    ('box-rogaland-1', 'AUTOMATISK_VANN'),
    ('box-rogaland-1', 'VINDU'),
    ('box-rogaland-2', 'GUMMIMATTE'),
    ('box-rogaland-2', 'AUTOMATISK_VANN'),
    ('box-rogaland-2', 'VINDU'),
    ('box-rogaland-2', 'PADDOCK'),
    ('box-trondelag-1', 'VINDU'),
    ('box-trondelag-2', 'VINDU'),
    ('box-trondelag-2', 'AUTOMATISK_VANN'),
    ('box-vestfold-1', 'AUTOMATISK_VANN'),
    ('box-vestfold-2', 'VINDU'),
    ('box-vestfold-2', 'AUTOMATISK_VANN'),
    ('box-vestfold-5', 'GUMMIMATTE'),
    ('box-vestfold-5', 'VINDU'),
    ('box-vestfold-5', 'AUTOMATISK_VANN'),
    ('box-vestfold-5', 'PADDOCK')
) AS t(box_id, amenity);

-- Verify the data
SELECT 
  s.name as stable_name,
  s.address_city,
  m.county_code,
  c.name as county_name,
  s.advertising_active,
  s.advertising_end_date,
  COUNT(b.id) as box_count
FROM stables s
JOIN municipalities m ON s.municipality_code = m.code
JOIN counties c ON m.county_code = c.code
LEFT JOIN boxes b ON s.id = b.stable_id
GROUP BY s.id, s.name, s.address_city, m.county_code, c.name, s.advertising_active, s.advertising_end_date
ORDER BY c.name, s.name;

-- Show box distribution
SELECT 
  c.name as county,
  COUNT(DISTINCT s.id) as stable_count,
  COUNT(b.id) as total_boxes,
  COUNT(CASE WHEN b.is_occupied = false THEN 1 END) as available_boxes,
  MIN(b.monthly_price) as min_price,
  MAX(b.monthly_price) as max_price,
  COUNT(CASE WHEN b.area < 10 THEN 1 END) as small_boxes,
  COUNT(CASE WHEN b.area >= 10 AND b.area < 15 THEN 1 END) as medium_boxes,
  COUNT(CASE WHEN b.area >= 15 THEN 1 END) as large_boxes
FROM counties c
JOIN municipalities m ON c.code = m.county_code
JOIN stables s ON m.code = s.municipality_code
LEFT JOIN boxes b ON s.id = b.stable_id
WHERE s.advertising_active = true
GROUP BY c.code, c.name
ORDER BY c.name;