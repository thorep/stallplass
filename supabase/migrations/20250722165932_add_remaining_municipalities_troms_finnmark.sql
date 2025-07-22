-- Add remaining municipalities for Troms and Finnmark, and expand Nordland

DO $$
DECLARE
    nordland_fylke_id UUID;
    troms_fylke_id UUID;
    finnmark_fylke_id UUID;
BEGIN
    -- Get fylke IDs
    SELECT id INTO nordland_fylke_id FROM fylker WHERE fylke_nummer = '18';
    SELECT id INTO troms_fylke_id FROM fylker WHERE fylke_nummer = '55';
    SELECT id INTO finnmark_fylke_id FROM fylker WHERE fylke_nummer = '56';
    
    -- Insert missing municipalities
    INSERT INTO kommuner (kommune_nummer, navn, fylke_id) VALUES
    
    -- More Nordland municipalities (it only had Bodo)
    ('1806', 'Narvik', nordland_fylke_id),
    ('1811', 'Bindal', nordland_fylke_id),
    ('1812', 'Somna', nordland_fylke_id),
    ('1813', 'Bronnoy', nordland_fylke_id),
    ('1815', 'Vega', nordland_fylke_id),
    ('1816', 'Vevelstad', nordland_fylke_id),
    ('1818', 'Heroy', nordland_fylke_id),
    ('1820', 'Alstahaug', nordland_fylke_id),
    ('1822', 'Leirfjord', nordland_fylke_id),
    ('1824', 'Vefsn', nordland_fylke_id),
    ('1825', 'Grane', nordland_fylke_id),
    ('1826', 'Hattfjelldal', nordland_fylke_id),
    ('1827', 'Donna', nordland_fylke_id),
    ('1828', 'Nesna', nordland_fylke_id),
    ('1832', 'Hemnes', nordland_fylke_id),
    ('1833', 'Rana', nordland_fylke_id),
    ('1834', 'Luroy', nordland_fylke_id),
    ('1835', 'Traena', nordland_fylke_id),
    ('1836', 'Rodoy', nordland_fylke_id),
    ('1837', 'Meloy', nordland_fylke_id),
    ('1838', 'Gildeskaal', nordland_fylke_id),
    ('1839', 'Beiarn', nordland_fylke_id),
    ('1840', 'Saltdal', nordland_fylke_id),
    ('1841', 'Fauske', nordland_fylke_id),
    ('1845', 'Sorfold', nordland_fylke_id),
    ('1848', 'Steigen', nordland_fylke_id),
    ('1851', 'Lodingen', nordland_fylke_id),
    ('1853', 'Evenes', nordland_fylke_id),
    ('1856', 'Rost', nordland_fylke_id),
    ('1857', 'Vaeroy', nordland_fylke_id),
    ('1859', 'Flakstad', nordland_fylke_id),
    ('1860', 'Vestvagoy', nordland_fylke_id),
    ('1865', 'Vagan', nordland_fylke_id),
    ('1866', 'Hadsel', nordland_fylke_id),
    ('1867', 'Bo', nordland_fylke_id),
    ('1868', 'Oksnes', nordland_fylke_id),
    ('1870', 'Sortland', nordland_fylke_id),
    ('1871', 'Andoy', nordland_fylke_id),
    
    -- Troms (55) - was missing most municipalities!
    ('5502', 'Harstad', troms_fylke_id),
    ('5511', 'Kvaefjord', troms_fylke_id),
    ('5512', 'Tjeldsund', troms_fylke_id),
    ('5513', 'Ibestad', troms_fylke_id),
    ('5514', 'Gratangen', troms_fylke_id),
    ('5515', 'Loabak', troms_fylke_id),
    ('5516', 'Bardu', troms_fylke_id),
    ('5517', 'Salangen', troms_fylke_id),
    ('5518', 'Malselv', troms_fylke_id),
    ('5519', 'Sorreisa', troms_fylke_id),
    ('5520', 'Dyroy', troms_fylke_id),
    ('5521', 'Senja', troms_fylke_id),
    ('5522', 'Balsfjord', troms_fylke_id),
    ('5523', 'Karlsoy', troms_fylke_id),
    ('5524', 'Lyngen', troms_fylke_id),
    ('5525', 'Storfjord', troms_fylke_id),
    ('5526', 'Kafjord', troms_fylke_id),
    ('5527', 'Skjervoy', troms_fylke_id),
    ('5528', 'Nordreisa', troms_fylke_id),
    ('5529', 'Kvaenangen', troms_fylke_id),
    
    -- Finnmark (56) - was completely missing!
    ('5601', 'Alta', finnmark_fylke_id),
    ('5603', 'Hammerfest', finnmark_fylke_id),
    ('5605', 'Sor-Varanger', finnmark_fylke_id),
    ('5607', 'Vadso', finnmark_fylke_id),
    ('5610', 'Loppa', finnmark_fylke_id),
    ('5612', 'Hasvik', finnmark_fylke_id),
    ('5614', 'Masoy', finnmark_fylke_id),
    ('5616', 'Nordkapp', finnmark_fylke_id),
    ('5618', 'Porsanger', finnmark_fylke_id),
    ('5620', 'Karasjok', finnmark_fylke_id),
    ('5622', 'Lebesby', finnmark_fylke_id),
    ('5624', 'Gamvik', finnmark_fylke_id),
    ('5626', 'Berlevag', finnmark_fylke_id),
    ('5628', 'Tana', finnmark_fylke_id),
    ('5630', 'Nesseby', finnmark_fylke_id),
    ('5632', 'Batsfjord', finnmark_fylke_id),
    ('5634', 'Vardo', finnmark_fylke_id)
    
    ON CONFLICT (kommune_nummer) DO NOTHING;

END $$;