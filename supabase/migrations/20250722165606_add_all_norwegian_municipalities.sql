-- Add key Norwegian municipalities that are missing

DO $$
DECLARE
    ostfold_fylke_id UUID;
    akershus_fylke_id UUID;
    buskerud_fylke_id UUID;
    vestfold_fylke_id UUID;
    telemark_fylke_id UUID;
    agder_fylke_id UUID;
    rogaland_fylke_id UUID;
    vestland_fylke_id UUID;
    more_romsdal_fylke_id UUID;
    trondelag_fylke_id UUID;
    innlandet_fylke_id UUID;
    nordland_fylke_id UUID;
    troms_fylke_id UUID;
    finnmark_fylke_id UUID;
BEGIN
    -- Get fylke IDs
    SELECT id INTO ostfold_fylke_id FROM fylker WHERE fylke_nummer = '31';
    SELECT id INTO akershus_fylke_id FROM fylker WHERE fylke_nummer = '32';
    SELECT id INTO buskerud_fylke_id FROM fylker WHERE fylke_nummer = '33';
    SELECT id INTO vestfold_fylke_id FROM fylker WHERE fylke_nummer = '39';
    SELECT id INTO telemark_fylke_id FROM fylker WHERE fylke_nummer = '40';
    SELECT id INTO agder_fylke_id FROM fylker WHERE fylke_nummer = '42';
    SELECT id INTO rogaland_fylke_id FROM fylker WHERE fylke_nummer = '11';
    SELECT id INTO vestland_fylke_id FROM fylker WHERE fylke_nummer = '46';
    SELECT id INTO more_romsdal_fylke_id FROM fylker WHERE fylke_nummer = '15';
    SELECT id INTO trondelag_fylke_id FROM fylker WHERE fylke_nummer = '50';
    SELECT id INTO innlandet_fylke_id FROM fylker WHERE fylke_nummer = '34';
    SELECT id INTO nordland_fylke_id FROM fylker WHERE fylke_nummer = '18';
    SELECT id INTO troms_fylke_id FROM fylker WHERE fylke_nummer = '55';
    SELECT id INTO finnmark_fylke_id FROM fylker WHERE fylke_nummer = '56';
    
    -- Insert key municipalities (avoiding duplicates with ON CONFLICT)
    INSERT INTO kommuner (kommune_nummer, navn, fylke_id) VALUES
    
    -- Østfold (31)
    ('3101', 'Halden', ostfold_fylke_id),
    ('3103', 'Moss', ostfold_fylke_id),
    ('3105', 'Sarpsborg', ostfold_fylke_id),
    ('3106', 'Fredrikstad', ostfold_fylke_id),
    
    -- Vestfold (39) - These were missing and causing the issue!
    ('3901', 'Horten', vestfold_fylke_id),
    ('3903', 'Holmestrand', vestfold_fylke_id),
    ('3905', 'Tønsberg', vestfold_fylke_id),
    ('3907', 'Sandefjord', vestfold_fylke_id),
    ('3918', 'Larvik', vestfold_fylke_id),
    
    -- Akershus (32)
    ('3201', 'Bærum', akershus_fylke_id),
    ('3203', 'Asker', akershus_fylke_id),
    ('3205', 'Lillestrøm', akershus_fylke_id),
    ('3207', 'Nordre Follo', akershus_fylke_id),
    
    -- Buskerud (33)
    ('3301', 'Drammen', buskerud_fylke_id),
    ('3303', 'Kongsberg', buskerud_fylke_id),
    ('3305', 'Ringerike', buskerud_fylke_id),
    
    -- Telemark (40)
    ('4001', 'Porsgrunn', telemark_fylke_id),
    ('4003', 'Skien', telemark_fylke_id),
    ('4005', 'Notodden', telemark_fylke_id),
    
    -- Agder (42) 
    ('4201', 'Kristiansand', agder_fylke_id),
    ('4202', 'Lindesnes', agder_fylke_id),
    ('4203', 'Farsund', agder_fylke_id),
    ('4204', 'Flekkefjord', agder_fylke_id),
    ('4205', 'Gjerstad', agder_fylke_id),
    ('4211', 'Grimstad', agder_fylke_id),
    ('4212', 'Arendal', agder_fylke_id),
    
    -- More Rogaland municipalities
    ('1101', 'Eigersund', rogaland_fylke_id),
    ('1111', 'Sokndal', rogaland_fylke_id),
    ('1112', 'Lund', rogaland_fylke_id),
    ('1119', 'Hå', rogaland_fylke_id),
    ('1120', 'Klepp', rogaland_fylke_id),
    ('1121', 'Time', rogaland_fylke_id),
    ('1122', 'Gjesdal', rogaland_fylke_id),
    ('1124', 'Sola', rogaland_fylke_id),
    ('1149', 'Karmøy', rogaland_fylke_id),
    
    -- More Møre og Romsdal municipalities 
    ('1505', 'Kristiansund', more_romsdal_fylke_id),
    ('1506', 'Averøy', more_romsdal_fylke_id),
    ('1507', 'Gjemnes', more_romsdal_fylke_id),
    ('1511', 'Vanylven', more_romsdal_fylke_id),
    ('1514', 'Sande', more_romsdal_fylke_id),
    ('1515', 'Herøy', more_romsdal_fylke_id),
    ('1516', 'Ulstein', more_romsdal_fylke_id),
    ('1517', 'Hareid', more_romsdal_fylke_id),
    ('1520', 'Ørsta', more_romsdal_fylke_id),
    ('1525', 'Stranda', more_romsdal_fylke_id),
    
    -- More Vestland municipalities
    ('4611', 'Etne', vestland_fylke_id),
    ('4612', 'Sveio', vestland_fylke_id),
    ('4613', 'Bømlo', vestland_fylke_id),
    ('4614', 'Stord', vestland_fylke_id),
    ('4617', 'Kvinnherad', vestland_fylke_id),
    ('4618', 'Ullensvang', vestland_fylke_id),
    ('4621', 'Voss', vestland_fylke_id),
    ('4627', 'Askøy', vestland_fylke_id),
    ('4640', 'Sogndal', vestland_fylke_id),
    
    -- More Trøndelag municipalities
    ('5006', 'Steinkjer', trondelag_fylke_id),
    ('5007', 'Namsos', trondelag_fylke_id),
    ('5014', 'Frøya', trondelag_fylke_id),
    ('5020', 'Osen', trondelag_fylke_id),
    ('5021', 'Oppdal', trondelag_fylke_id),
    ('5022', 'Rennebu', trondelag_fylke_id),
    ('5025', 'Røros', trondelag_fylke_id),
    ('5026', 'Holtålen', trondelag_fylke_id),
    ('5027', 'Midtre Gauldal', trondelag_fylke_id),
    ('5028', 'Melhus', trondelag_fylke_id),
    ('5029', 'Skaun', trondelag_fylke_id),
    ('5031', 'Malvik', trondelag_fylke_id),
    ('5032', 'Selbu', trondelag_fylke_id),
    ('5033', 'Tydal', trondelag_fylke_id),
    ('5034', 'Meråker', trondelag_fylke_id),
    ('5035', 'Stjørdal', trondelag_fylke_id),
    ('5036', 'Frosta', trondelag_fylke_id),
    ('5037', 'Levanger', trondelag_fylke_id),
    ('5038', 'Verdal', trondelag_fylke_id),
    ('5041', 'Snåsa', trondelag_fylke_id),
    ('5042', 'Lierne', trondelag_fylke_id),
    ('5043', 'Røyrvik', trondelag_fylke_id),
    ('5044', 'Namsskogan', trondelag_fylke_id),
    ('5045', 'Grong', trondelag_fylke_id),
    ('5046', 'Høylandet', trondelag_fylke_id),
    ('5047', 'Overhalla', trondelag_fylke_id),
    ('5049', 'Flatanger', trondelag_fylke_id),
    ('5052', 'Leka', trondelag_fylke_id),
    ('5053', 'Inderøy', trondelag_fylke_id),
    ('5054', 'Indre Fosen', trondelag_fylke_id),
    ('5055', 'Heim', trondelag_fylke_id),
    ('5056', 'Hitra', trondelag_fylke_id),
    ('5057', 'Ørland', trondelag_fylke_id),
    ('5058', 'Åfjord', trondelag_fylke_id),
    ('5059', 'Orkland', trondelag_fylke_id),
    ('5060', 'Nærøysund', trondelag_fylke_id),
    ('5061', 'Rindal', trondelag_fylke_id),
    
    -- Innlandet municipalities
    ('3401', 'Kongsvinger', innlandet_fylke_id),
    ('3403', 'Hamar', innlandet_fylke_id),
    ('3405', 'Lillehammer', innlandet_fylke_id),
    ('3407', 'Gjøvik', innlandet_fylke_id),
    ('3411', 'Ringsaker', innlandet_fylke_id),
    ('3412', 'Løten', innlandet_fylke_id),
    ('3413', 'Stange', innlandet_fylke_id),
    ('3414', 'Nord-Odal', innlandet_fylke_id),
    ('3415', 'Sør-Odal', innlandet_fylke_id),
    ('3416', 'Eidskog', innlandet_fylke_id),
    ('3417', 'Grue', innlandet_fylke_id),
    ('3418', 'Åsnes', innlandet_fylke_id),
    ('3419', 'Våler', innlandet_fylke_id),
    ('3420', 'Elverum', innlandet_fylke_id),
    ('3421', 'Trysil', innlandet_fylke_id),
    ('3422', 'Åmot', innlandet_fylke_id),
    ('3423', 'Stor-Elvdal', innlandet_fylke_id),
    ('3424', 'Rendalen', innlandet_fylke_id),
    ('3425', 'Engerdal', innlandet_fylke_id),
    ('3426', 'Tolga', innlandet_fylke_id),
    ('3427', 'Tynset', innlandet_fylke_id),
    ('3428', 'Alvdal', innlandet_fylke_id),
    ('3429', 'Folldal', innlandet_fylke_id),
    ('3430', 'Os', innlandet_fylke_id),
    ('3431', 'Dovre', innlandet_fylke_id),
    ('3432', 'Lesja', innlandet_fylke_id),
    ('3433', 'Skjåk', innlandet_fylke_id),
    ('3434', 'Lom', innlandet_fylke_id),
    ('3435', 'Vågå', innlandet_fylke_id),
    ('3436', 'Nord-Fron', innlandet_fylke_id),
    ('3437', 'Sel', innlandet_fylke_id),
    ('3438', 'Sør-Fron', innlandet_fylke_id),
    ('3439', 'Ringebu', innlandet_fylke_id),
    ('3440', 'Øyer', innlandet_fylke_id),
    ('3441', 'Gausdal', innlandet_fylke_id),
    ('3442', 'Østre Toten', innlandet_fylke_id),
    ('3443', 'Vestre Toten', innlandet_fylke_id),
    ('3446', 'Gran', innlandet_fylke_id),
    ('3447', 'Søndre Land', innlandet_fylke_id),
    ('3448', 'Nordre Land', innlandet_fylke_id),
    ('3449', 'Sør-Aurdal', innlandet_fylke_id),
    ('3450', 'Etnedal', innlandet_fylke_id),
    ('3451', 'Nord-Aurdal', innlandet_fylke_id),
    ('3452', 'Vestre Slidre', innlandet_fylke_id),
    ('3453', 'Øystre Slidre', innlandet_fylke_id),
    ('3454', 'Vang', innlandet_fylke_id)
    
    ON CONFLICT (kommune_nummer) DO NOTHING;

END $$;