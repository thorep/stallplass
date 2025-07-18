-- Insert three pricing tiers
INSERT INTO pricing_tiers (id, name, price, "displayName", description, features, "isActive", "createdAt", "updatedAt")
VALUES 
  (
    gen_random_uuid(),
    '1',
    9900, -- 99 kr
    'Starter',
    'Perfekt for små staller',
    '{"Opptil 5 stallbokser", "Grunnleggende støtte", "Basis annonsering"}',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '2', 
    19900, -- 199 kr
    'Standard',
    'For de fleste staller',
    '{"Opptil 20 stallbokser", "Prioritert støtte", "Fremhevet annonsering", "Avansert statistikk"}',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '3',
    39900, -- 399 kr
    'Premium',
    'For store staller og rideskoler',
    '{"Ubegrenset stallbokser", "Dedikert støtte", "Topplassering", "Avansert statistikk", "Egendefinert profil"}',
    true,
    NOW(),
    NOW()
  );