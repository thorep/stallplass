-- Prepare DB state before tests

-- 0) Reset: clear stables and prior auto-generated test profiles
--    Match teardown (afterTests.sql) for a clean slate before seeding.
TRUNCATE TABLE "stables" RESTART IDENTITY CASCADE;
DELETE FROM profiles WHERE nickname LIKE 'test_user_%';

-- 1) Ensure required test owner exists (profiles.nickname = 'user1').
--    If not found, raise error and abort test run.
DO $$
DECLARE
  owner_id text;
BEGIN
  SELECT id INTO owner_id FROM profiles WHERE nickname = 'user1' LIMIT 1;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Påkrevd testbruker "user1" mangler i profiles. Avbryter tester.';
  END IF;
END $$;

-- 2) Insert 5 stables owned by 'user1' (nickname)
WITH owner AS (
  SELECT id FROM profiles WHERE nickname = 'user1' LIMIT 1
), data AS (
  SELECT * FROM (
    VALUES
      ('Stall 1', 'Test stable 1'),
      ('Stall 2', 'Test stable 2'),
      ('Stall 3', 'Test stable 3'),
      ('Stall 4', 'Test stable 4'),
      ('Stall 5', 'Test stable 5')
  ) AS t(name, description)
)
INSERT INTO stables (
  name,
  description,
  "ownerId",
  address,
  latitude,
  longitude,
  "postalCode",
  "countyId",
  "municipalityId",
  "postalPlace",
  images,
  "imageDescriptions",
  "createdAt",
  "updatedAt"
)
SELECT
  d.name,
  d.description,
  o.id,
  'Oslo gate 1C',
  59.9082077003434::double precision,
  10.7675314857339::double precision,
  '0192',
  '733c8b6d-7c8a-477b-8a09-42cd99fa9bf6',
  '70cf1eec-a815-4038-9995-aba3272286dd',
  'OSLO',
  ARRAY['http://127.0.0.1:54321/storage/v1/object/public/stableimages/a024a9a4-b4af-4460-8729-1e4b5891dd11/1756636608969-hc65mar4dd9.jpg']::text[],
  '{}'::text[],
  NOW(),
  NOW()
FROM owner o
CROSS JOIN data d
WHERE NOT EXISTS (
  SELECT 1 FROM stables s WHERE s."ownerId" = o.id AND s.name = d.name
);

-- 3) Create 50 additional test users and one stable each (unique owners)
--    Users get varying levels of info populated. Records are idempotent by deterministic IDs.
WITH seq AS (
  SELECT to_char(g, 'FM000') AS idx, g::int AS n
  FROM generate_series(1, 50) AS g
), new_profiles AS (
  SELECT
    ('test-user-' || idx) AS id,
    ('test_user_' || idx) AS nickname,
    CASE WHEN n % 4 = 0 THEN '480000' || idx ELSE NULL END AS phone,
    CASE WHEN n % 2 = 0 THEN 'Test' ELSE NULL END AS firstname,
    CASE WHEN n % 3 = 0 THEN 'Bruker' ELSE NULL END AS lastname,
    CASE WHEN n % 5 = 0 THEN 'Gate ' || n::text ELSE NULL END AS adresse1,
    CASE WHEN n % 7 = 0 THEN 'C/O ' || n::text ELSE NULL END AS adresse2,
    CASE WHEN n % 6 = 0 THEN '10' || idx ELSE NULL END AS postnr,
    CASE WHEN n % 8 = 0 THEN 'OSLO' ELSE NULL END AS poststed,
    (n % 2 = 0) AS email_consent,
    NOT (n % 6 = 0) AS msg_email
  FROM seq
), inserted_profiles AS (
  INSERT INTO profiles (
    id, nickname, "createdAt", "updatedAt", phone, "isAdmin", firstname, lastname,
    "Adresse1", "Adresse2", "Postnummer", "Poststed", email_consent, message_notification_email
  )
  SELECT
    p.id, p.nickname, NOW(), NOW(), p.phone, false, p.firstname, p.lastname,
    p.adresse1, p.adresse2, p.postnr, p.poststed, p.email_consent, p.msg_email
  FROM new_profiles p
  ON CONFLICT (id) DO NOTHING
  RETURNING id, nickname
), all_profiles AS (
  -- Ensure we have all 50 ids even if they existed from a previous run
  SELECT id, nickname FROM inserted_profiles
  UNION ALL
  SELECT pr.id, pr.nickname
  FROM new_profiles np
  JOIN profiles pr ON pr.id = np.id
)
INSERT INTO stables (
  name,
  description,
  "ownerId",
  address,
  latitude,
  longitude,
  "postalCode",
  "countyId",
  "municipalityId",
  "postalPlace",
  images,
  "imageDescriptions",
  "createdAt",
  "updatedAt"
)
SELECT
  'Stall Oslo ' || ap.nickname,
  'Auto-generert test-stall for ' || ap.nickname,
  ap.id,
  'Oslo gate 1C',
  59.9082077003434::double precision,
  10.7675314857339::double precision,
  '0192',
  '733c8b6d-7c8a-477b-8a09-42cd99fa9bf6',
  '70cf1eec-a815-4038-9995-aba3272286dd',
  'OSLO',
  ARRAY['http://127.0.0.1:54321/storage/v1/object/public/stableimages/a024a9a4-b4af-4460-8729-1e4b5891dd11/1756636608969-hc65mar4dd9.jpg']::text[],
  '{}'::text[],
  NOW(),
  NOW()
FROM all_profiles ap
WHERE NOT EXISTS (
  SELECT 1 FROM stables s WHERE s."ownerId" = ap.id AND s.name = ('Stall Oslo ' || ap.nickname)
);
