-- Forum sections and categories for Norwegian horse forum
-- Run this in Supabase SQL editor to populate forum structure

-- Clear existing data first (optional - remove these lines if you want to keep existing data)
DELETE FROM forum_categories;
DELETE FROM forum_sections;

-- Insert forum sections first
INSERT INTO forum_sections (id, name, description, color, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Velkommen', 'Introduksjon og generell diskusjon', '#3B82F6', 1, true, now(), now()),
  (gen_random_uuid(), 'Ridning og Trening', 'Alt om ridning, trening og teknikk', '#10B981', 2, true, now(), now()),
  (gen_random_uuid(), 'Helse og Pleie', 'Hestehelse, veterinær og stell', '#EF4444', 3, true, now(), now()),
  (gen_random_uuid(), 'Avl og Raser', 'Oppdrett, avl og raseinformasjon', '#8B5CF6', 4, true, now(), now()),
  (gen_random_uuid(), 'Utstyr og Seletøy', 'Rideutstyr, stall og transport', '#F59E0B', 5, true, now(), now()),
  (gen_random_uuid(), 'Sosialt', 'Opplevelser, bilder og fellesskap', '#EC4899', 6, true, now(), now());

-- Insert categories with references to sections
WITH section_ids AS (
  SELECT id, name FROM forum_sections
)
INSERT INTO forum_categories (id, name, slug, description, color, icon, "sortOrder", "isActive", "sectionId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  category_name,
  category_slug,
  category_desc,
  category_color,
  category_icon,
  category_sort,
  true,
  s.id,
  now(),
  now()
FROM (
  VALUES
    -- Velkommen section
    ('Introduksjoner', 'introduksjoner', 'Presenter deg selv og hesten din', '#3B82F6', 'UserPlus', 1, 'Velkommen'),
    ('Generell diskusjon', 'generell-diskusjon', 'Alt som ikke passer i andre kategorier', '#6B7280', 'MessageCircle', 2, 'Velkommen'),
    ('Spørsmål og svar', 'sporsmal-og-svar', 'Still spørsmål til erfarne hestemenn', '#3B82F6', 'HelpCircle', 3, 'Velkommen'),
    
    -- Ridning og Trening section
    ('Nybegynnere', 'nybegynnere', 'For deg som er ny til ridning', '#10B981', 'Baby', 1, 'Ridning og Trening'),
    ('Rideteknisk utvikling', 'rideteknisk-utvikling', 'Tips og råd for å bli en bedre rytter', '#10B981', 'TrendingUp', 2, 'Ridning og Trening'),
    ('Sprang', 'sprang', 'Hinderridning og springkonkurranser', '#EF4444', 'Zap', 3, 'Ridning og Trening'),
    ('Dressur', 'dressur', 'Klassisk dressur og treningsmetoder', '#8B5CF6', 'Crown', 4, 'Ridning og Trening'),
    ('Feltritt/Eventing', 'feltritt-eventing', 'Terrengridning og eventing', '#059669', 'Mountain', 5, 'Ridning og Trening'),
    ('Western', 'western', 'Westernridning og reining', '#92400E', 'Hat', 6, 'Ridning og Trening'),
    ('Turridning', 'turridning', 'Terrengridning og naturopplevelser', '#047857', 'MapPin', 7, 'Ridning og Trening'),
    ('Islandshest', 'islandshest', 'Alt om islandshester og speciell ganger', '#1E40AF', 'Snowflake', 8, 'Ridning og Trening'),
    ('Trav og Galopp', 'trav-og-galopp', 'Veddeløp og kappkjøring', '#7C2D12', 'Zap', 9, 'Ridning og Trening'),
    
    -- Helse og Pleie section
    ('Veterinære spørsmål', 'veterinare-sporsmal', 'Helse og sykdom - ikke erstatter veterinær', '#EF4444', 'Heart', 1, 'Helse og Pleie'),
    ('Fôring og ernæring', 'foring-og-ernaring', 'Fôringsråd og ernæringsspørsmål', '#10B981', 'Apple', 2, 'Helse og Pleie'),
    ('Hov og beslag', 'hov-og-beslag', 'Hovpleie, beslag og barbeint', '#92400E', 'Shield', 3, 'Helse og Pleie'),
    ('Daglig stell', 'daglig-stell', 'Pusling, pleie og stellrutiner', '#06B6D4', 'Brush', 4, 'Helse og Pleie'),
    ('Tannhelse', 'tannhelse', 'Tannbehandling og munnhelse', '#F59E0B', 'Smile', 5, 'Helse og Pleie'),
    
    -- Avl og Raser section  
    ('Avl og oppdrett', 'avl-og-oppdrett', 'Avlsplanlegging og oppdrett', '#8B5CF6', 'Heart', 1, 'Avl og Raser'),
    ('Raseinformasjon', 'raseinformasjon', 'Diskusjon om ulike hesteraser', '#7C3AED', 'Info', 2, 'Avl og Raser'),
    ('Unghester', 'unghester', 'Innriding og oppdragelse', '#10B981', 'Baby', 3, 'Avl og Raser'),
    ('Genetikk', 'genetikk', 'Arvelære og genetisk rådgivning', '#1E40AF', 'Dna', 4, 'Avl og Raser'),
    
    -- Utstyr og Seletøy section
    ('Sal og hovedtøy', 'sal-og-hovedtoy', 'Saler, trenser og tilbehør', '#F59E0B', 'Package', 1, 'Utstyr og Seletøy'),
    ('Dekken og bandager', 'dekken-og-bandager', 'Regnfrakker, ulldekken og beskyttelse', '#06B6D4', 'Shield', 2, 'Utstyr og Seletøy'),
    ('Stallinnredning', 'stallinnredning', 'Bokser, gjerder og stallutstyr', '#92400E', 'Home', 3, 'Utstyr og Seletøy'),
    ('Transport', 'transport', 'Hengere, trailere og transport', '#1F2937', 'Truck', 4, 'Utstyr og Seletøy'),
    ('Produktanmeldelser', 'produktanmeldelser', 'Anmeldelser av hestetilbehør', '#059669', 'Star', 5, 'Utstyr og Seletøy'),
    
    -- Sosialt section
    ('Bilder og videoer', 'bilder-og-videoer', 'Del bilder og videoer av hesten din', '#EC4899', 'Camera', 1, 'Sosialt'),
    ('Ritt og opplevelser', 'ritt-og-opplevelser', 'Fortell om flotte rittopplevelser', '#10B981', 'MapPin', 2, 'Sosialt'),
    ('Konkurranse og stevner', 'konkurranse-og-stevner', 'Stevnerapporter og resultater', '#F59E0B', 'Trophy', 3, 'Sosialt'),
    ('Møteplasser', 'moteplasser', 'Arrangementer og sammenkomster', '#8B5CF6', 'Users', 4, 'Sosialt'),
    ('Hestehumor', 'hestehumor', 'Morsomheter og vitser om hest', '#EC4899', 'Smile', 5, 'Sosialt'),
    ('Off-topic', 'off-topic', 'Alt annet som ikke handler om hest', '#6B7280', 'MessageSquare', 6, 'Sosialt')
) AS categories(category_name, category_slug, category_desc, category_color, category_icon, category_sort, section_name)
JOIN section_ids s ON s.name = categories.section_name;