-- Production Seed Script for Horse Sales Data
-- This script seeds the production database with horse breeds and disciplines
-- Run this in your production database (Supabase SQL Editor)

-- Insert horse breeds (raser)
-- Using INSERT with ON CONFLICT to handle duplicates safely
INSERT INTO horse_breeds (name, "isActive", "createdAt", "updatedAt") VALUES
  ('American Curly', true, NOW(), NOW()),
  ('Andalusier', true, NOW(), NOW()),
  ('Araber', true, NOW(), NOW()),
  ('Ardenner', true, NOW(), NOW()),
  ('Clydesdale', true, NOW(), NOW()),
  ('Connemara', true, NOW(), NOW()),
  ('Dartmoor', true, NOW(), NOW()),
  ('Exmoor', true, NOW(), NOW()),
  ('Fjordhest', true, NOW(), NOW()),
  ('Frieser', true, NOW(), NOW()),
  ('Fullblod', true, NOW(), NOW()),
  ('Gotlandsruss', true, NOW(), NOW()),
  ('Haflinger', true, NOW(), NOW()),
  ('Hannoveraner', true, NOW(), NOW()),
  ('Holsteiner', true, NOW(), NOW()),
  ('Irish Cob', true, NOW(), NOW()),
  ('Islandshest', true, NOW(), NOW()),
  ('Kallblodstraver', true, NOW(), NOW()),
  ('Kaspisk hest', true, NOW(), NOW()),
  ('KWPN', true, NOW(), NOW()),
  ('Lipizzaner', true, NOW(), NOW()),
  ('Lusitano', true, NOW(), NOW()),
  ('Miniatyrhest', true, NOW(), NOW()),
  ('Morgan', true, NOW(), NOW()),
  ('Mustang', true, NOW(), NOW()),
  ('New Forest', true, NOW(), NOW()),
  ('Nordsvensk brukshest', true, NOW(), NOW()),
  ('Oldenburger', true, NOW(), NOW()),
  ('Paint', true, NOW(), NOW()),
  ('PRE', true, NOW(), NOW()),
  ('Quarter', true, NOW(), NOW()),
  ('Russisk basjkir', true, NOW(), NOW()),
  ('Shetlandspony', true, NOW(), NOW()),
  ('Shire', true, NOW(), NOW()),
  ('Norsk ridepony', true, NOW(), NOW()),
  ('Tinker', true, NOW(), NOW()),
  ('Trakehner', true, NOW(), NOW()),
  ('Varmblod (halvblod)', true, NOW(), NOW()),
  ('Varmblod (traver)', true, NOW(), NOW()),
  ('Welsh', true, NOW(), NOW()),
  ('Andre', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert horse disciplines (grener)
INSERT INTO horse_disciplines (name, "isActive", "createdAt", "updatedAt") VALUES
  ('Western', true, NOW(), NOW()),
  ('Akademisk', true, NOW(), NOW()),
  ('Allround', true, NOW(), NOW()),
  ('Avl', true, NOW(), NOW()),
  ('Barokk', true, NOW(), NOW()),
  ('Distanse', true, NOW(), NOW()),
  ('Dressur', true, NOW(), NOW()),
  ('Terrengritt', true, NOW(), NOW()),
  ('Galopp', true, NOW(), NOW()),
  ('Hoppning', true, NOW(), NOW()),
  ('Islandshest', true, NOW(), NOW()),
  ('Kjøring', true, NOW(), NOW()),
  ('Selskap', true, NOW(), NOW()),
  ('Trav', true, NOW(), NOW()),
  ('Utstilling', true, NOW(), NOW()),
  ('Working Equitation', true, NOW(), NOW()),
  ('Annet', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT 'Horse Breeds Inserted:' as info, COUNT(*) as count FROM horse_breeds WHERE "isActive" = true;
SELECT 'Horse Disciplines Inserted:' as info, COUNT(*) as count FROM horse_disciplines WHERE "isActive" = true;

-- Display sample data to verify
SELECT 'Sample Horse Breeds:' as info;
SELECT id, name, "isActive", "createdAt" FROM horse_breeds WHERE "isActive" = true ORDER BY name LIMIT 10;

SELECT 'Sample Horse Disciplines:' as info;
SELECT id, name, "isActive", "createdAt" FROM horse_disciplines WHERE "isActive" = true ORDER BY name LIMIT 10;