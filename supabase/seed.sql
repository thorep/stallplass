-- Insert base pricing data
INSERT INTO base_prices (name, price, description) VALUES
  ('Standard listing', 299, 'Monthly fee for standard stable listing'),
  ('Featured listing', 499, 'Monthly fee for featured stable listing with extra visibility');

-- Insert pricing discounts
INSERT INTO pricing_discounts (months, percentage) VALUES
  (3, 10.0),
  (6, 15.0),
  (12, 20.0);

-- Insert stable amenities
INSERT INTO stable_amenities (name) VALUES
  ('Innebane'),
  ('Utebane'),
  ('Beredesbane'),
  ('Longebane'),
  ('Solarium'),
  ('Vaskehall'),
  ('Beiteområde'),
  ('Hestetrailer parkering'),
  ('Bilparkering'),
  ('Oppredningsrom'),
  ('Salebod'),
  ('Stallkafé'),
  ('Sosialrom'),
  ('Toalett'),
  ('Dusj'),
  ('24/7 tilgang'),
  ('Videoovervåkning'),
  ('Automatkasse'),
  ('Førkjøring'),
  ('Hestepass service');

-- Insert box amenities
INSERT INTO box_amenities (name) VALUES
  ('Stort rom'),
  ('Middels rom'),
  ('Lite rom'),
  ('Vindu'),
  ('Strøm'),
  ('Vann'),
  ('Oppvarming'),
  ('Gummimatter'),
  ('Høybed'),
  ('Automatisk vanningsystem'),
  ('Daglig stell inkludert'),
  ('Kraftfôr inkludert'),
  ('Høy inkludert'),
  ('Helger og ferier dekket'),
  ('Dyrlege service');

-- Insert roadmap items
INSERT INTO roadmap_items (title, description, category, status, priority, is_public) VALUES
  ('Mobile App', 'Develop native mobile applications for iOS and Android', 'Mobile', 'PLANNED', 'HIGH', true),
  ('Advanced Search Filters', 'Add more granular search options including price ranges, amenities, and location radius', 'Platform', 'IN_PROGRESS', 'MEDIUM', true),
  ('Payment Integration', 'Integrate multiple payment providers including Stripe and Klarna', 'Payments', 'COMPLETED', 'HIGH', true),
  ('Review System', 'Two-way review system between stable owners and renters', 'Social', 'COMPLETED', 'MEDIUM', true),
  ('Real-time Chat', 'In-app messaging between users and stable owners', 'Communication', 'IN_PROGRESS', 'HIGH', true),
  ('Calendar Integration', 'Booking calendar for temporary stays and lessons', 'Booking', 'PLANNED', 'MEDIUM', true),
  ('Multi-language Support', 'Support for English and Swedish in addition to Norwegian', 'Localization', 'PLANNED', 'LOW', true);